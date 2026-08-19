from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import spacy
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import pandas as pd
import os
import re
from collections import Counter
 
#  NLTK Setup
def setup_nltk():
    resources = ['vader_lexicon', 'punkt', 'punkt_tab']
    for res in resources:
        try:
            nltk.data.find(res)
        except LookupError:
            nltk.download(res)
 
setup_nltk()
 
# Initialize Flask 
app = Flask(__name__)
CORS(app)
 
#  Initialize AI Tools
analyzer = SentimentIntensityAnalyzer()
 
# Domain-Specific Sentiment Tuning 
restaurant_context_lexicon = {
    'salty': -1.8,
    'spicy': -0.5,
    'cold': -2.0,
    'oily': -1.5,
    'bland': -2.0,
    'slow': -2.0,
    'rude': -3.5,
    'overcooked': -2.0,
    'undercooked': -2.0,
    'not bad': 0.8,
}
analyzer.lexicon.update(restaurant_context_lexicon)
 
# Load Spacy
try:
    nlp = spacy.load("en_core_web_sm")
except:
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")
 

POSITIVE_WORDS = {
    'good', 'great', 'nice', 'delicious', 'amazing', 'excellent',
    'wonderful', 'fantastic', 'tasty', 'fresh', 'perfect', 'best',
    'love', 'lovely', 'awesome', 'superb', 'enjoyable', 'pleasant',
    'yummy', 'crispy', 'tender', 'flavourful', 'flavorful', 'juicy',
    'rich', 'smooth', 'creamy', 'warm', 'hot', 'generous', 'clean',
}
 
NEGATIVE_TRIGGERS = {
    'salty', 'spicy', 'oily', 'cold', 'bland', 'slow',
    'overcooked', 'undercooked', 'rude', 'greasy', 'burnt',
}
 

def split_into_clauses(text: str, menu_items: list = None) -> list[str]:
    raw_clauses = re.split(
        r'[,;]|\bbut\b|\bhowever\b|\bthough\b|\bwhile\b|\balthough\b|\byet\b|\band\b',
        text,
        flags=re.IGNORECASE
    )
    raw_clauses = [c.strip() for c in raw_clauses if c.strip()]
    menu_items = menu_items or []
    sorted_items = sorted(menu_items, key=len, reverse=True)  # longest names first

    merged = []
    buffer = ""
    for clause in raw_clauses:
        doc = nlp(clause)

        clause_lower = clause.lower()
        item_spans = []
        for food in sorted_items:
            food_lower = food.lower()
            for m in re.finditer(rf'\b{re.escape(food_lower)}\b', clause_lower):
                item_spans.append(m.span())

        def _inside_item_span(token):
            return any(s <= token.idx < e for s, e in item_spans)

        has_predicate = any(
            tok.pos_ in ("VERB", "AUX") and not _inside_item_span(tok)
            for tok in doc
        )

        if not has_predicate:
            buffer = f"{buffer} {clause}".strip() if buffer else clause
        else:
            if buffer:
                merged.append(f"{buffer} {clause}".strip())
                buffer = ""
            else:
                merged.append(clause)

    if buffer:
        merged.append(buffer)

    return merged
 
def split_clause_by_items(clause: str, menu_items: list) -> list:
    """
    If a clause mentions 2+ menu items, split it into one segment per item.

    Handles two patterns:
    1. "Item1 is great, Item2 is bad" - each item already has its own
       descriptive text right after it. Used as-is.
    2. "Item1 and Item2 good" / "both Item1 and Item2 good" - elliptical
       coordination where the descriptor only appears once, after the LAST
       item, but applies to every item in the group. Earlier items with no
       descriptor of their own borrow the nearest one to their right instead
       of being scored as bare/neutral.

    Returns [(None, clause)] if 0 or 1 items found (no split needed -
    caller falls back to existing single-clause scoring).
    """
    sorted_items = sorted(menu_items, key=len, reverse=True)  # longest names first, avoids partial overlaps
    clause_lower = clause.lower()
    matches = []       # (start, end, food)
    used_spans = []

    for food in sorted_items:
        food_lower = food.lower()
        for m in re.finditer(rf'\b{re.escape(food_lower)}\b', clause_lower):
            start, end = m.span()
            if any(s <= start < e or s < end <= e for s, e in used_spans):
                continue  # skip overlap with an already-matched longer item name
            matches.append((start, end, food))
            used_spans.append((start, end))

    if len(matches) < 2:
        return [(None, clause)]

    matches.sort(key=lambda x: x[0])

    # Text strictly between this item's name and the next item's name
    # (or clause end for the last item).
    descriptors = []
    for i, (start, end, food) in enumerate(matches):
        seg_end = matches[i + 1][0] if i + 1 < len(matches) else len(clause)
        descriptors.append(clause[end:seg_end].strip())

    # Backward-fill: an item with no descriptor of its own (pure coordination,
    # e.g. "Item1 and Item2 good") borrows the nearest descriptor to its right
    # instead of being scored on its bare name alone.
    filled = descriptors[:]
    next_descriptor = ''
    for i in range(len(filled) - 1, -1, -1):
        if filled[i]:
            next_descriptor = filled[i]
        else:
            filled[i] = next_descriptor

    segments = []
    for (start, end, food), desc in zip(matches, filled):
        segment_text = f"{food} {desc}".strip() if desc else food
        segments.append((food, segment_text))

    return segments

# Routes
 
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "AI Service is online", "port": 5001}), 200
 
 

# Bulk Sentiment Analysis
@app.route('/analyze', methods=['POST'])
def analyze_bulk_reviews():
    try:
        data = request.json
        reviews = data.get('reviews', [])
        menu_items = data.get('menuItems', [])
 
        if not reviews:
            return jsonify({"error": "No reviews provided"}), 400
 
        results = []
 
        for item in reviews:
            review_id = item.get('id')
            text = item.get('text', '')
            if not text:
                continue
 
            # Global sentiment - computed on the full review text
            global_scores = analyzer.polarity_scores(text)
            compound = global_scores['compound']
 
            # Dish-Level (Aspect-Based) Analysis
            # Split into clauses FIRST so each dish is scored in isolation.
            # This prevents a negative word in one clause from dragging down
            # the sentiment score of a different dish in another clause.
            food_analysis = []
            clauses = split_into_clauses(text, menu_items)
 
            for clause in clauses:
                item_segments = split_clause_by_items(clause, menu_items)

                if item_segments[0][0] is None:
                    # Single item (or none) in this clause — original behavior
                    clean_clause = clause.lower()
                    for food in menu_items:
                        food_lower = food.lower()
                        if not re.search(rf'\b{re.escape(food_lower)}\b', clean_clause):
                            continue

                        res = analyzer.polarity_scores(clause)
                        sent_score = res['compound']

                        if 'too' in clean_clause and any(w in clean_clause for w in NEGATIVE_TRIGGERS):
                            sent_score = -0.6

                        if sent_score >= 0.08:
                            label = "Positive"
                        elif sent_score <= -0.08:
                            label = "Negative"
                        else:
                            label = "Neutral"

                        food_analysis.append({
                            "foodName": food,
                            "sentiment": label,
                            "score": round(sent_score, 4),
                            "textSegment": clause
                        })
                else:
                    # Multiple items packed into one clause — score each independently
                    for food, segment_text in item_segments:
                        clean_segment = segment_text.lower()
                        res = analyzer.polarity_scores(segment_text)
                        sent_score = res['compound']

                        if 'too' in clean_segment and any(w in clean_segment for w in NEGATIVE_TRIGGERS):
                            sent_score = -0.6

                        if sent_score >= 0.08:
                            label = "Positive"
                        elif sent_score <= -0.08:
                            label = "Negative"
                        else:
                            label = "Neutral"

                        food_analysis.append({
                            "foodName": food,
                            "sentiment": label,
                            "score": round(sent_score, 4),
                            "textSegment": segment_text
                        })
 
            # Keyword Extraction (uses full-doc SpaCy parse)
            doc = nlp(text)
            keywords = [
                chunk.text.lower()
                for chunk in doc.noun_chunks
                if len(chunk.text) > 2
            ]
 
            results.append({
                "id": review_id,
                "label": (
                    "Positive" if compound >= 0.05
                    else "Negative" if compound <= -0.05
                    else "Neutral"
                ),
                "score": round(compound, 4),
                "foodAnalysis": food_analysis,
                "keywords": list(set(keywords))[:5]
            })
 
        return jsonify({"results": results})
 
    except Exception as e:
        print(f"Error in /analyze: {str(e)}")
        return jsonify({"error": str(e)}), 500
 

# Menu Item Specific Insights
@app.route('/analyze-menu-item', methods=['POST'])
def analyze_menu_item():
    try:
        data = request.json
        reviews = data.get('reviews', [])
        item_name = data.get('itemName', '').lower().strip()

        if not reviews or len(reviews) == 0:
            return jsonify({
                "suggestion": "Gathering more customer feedback...",
                "status": "neutral",
                "reviewCount": 0
            }), 200

        negative_attributes = []
        relevant_scores = []   # only scores from clauses that mention this item
        NEGATION_WORDS = {'not', "n't", 'no', 'never', 'without'}

        for text in reviews:
            matching_clauses_source = split_into_clauses(text, [item_name] if item_name else None)  # was: split_into_clauses(text)
            clauses = matching_clauses_source

            # Only analyze clauses that actually mention this specific item.
            # Without this filter, a review rating 3 dishes contributes its
            # ENTIRE text to every one of those dishes' insights — so a
            # complaint about Dish A gets wrongly blamed on Dish B and C too.
            matching_clauses = [
                c for c in clauses
                if item_name and re.search(rf'\b{re.escape(item_name)}\b', c.lower())
            ]

            # Fallback: if the item name isn't found in any clause (e.g. name
            # mismatch, or review only gave a numeric rating with no mention),
            # skip text-based scoring for this review entirely rather than
            # attributing unrelated clauses to this item.
            if not matching_clauses:
                continue

            for clause in matching_clauses:
                clause_score = analyzer.polarity_scores(clause)['compound']
                clean_clause = clause.lower()

                if 'too' in clean_clause and any(w in clean_clause for w in NEGATIVE_TRIGGERS):
                    clause_score = -0.6

                relevant_scores.append(clause_score)

                if clause_score < -0.05:
                    doc = nlp(clause)
                    for i, token in enumerate(doc):
                        lemma = token.lemma_.lower()
                        if token.pos_ != "ADJ":
                            continue

                        window_start = max(0, i - 2)
                        preceding = [t.text.lower() for t in doc[window_start:i]]
                        is_negated = any(neg in preceding for neg in NEGATION_WORDS)

                        if lemma in POSITIVE_WORDS and not is_negated:
                            continue

                        negative_attributes.append(f"not {lemma}" if lemma in POSITIVE_WORDS else lemma)

        if not relevant_scores:
            return jsonify({
                "suggestion": "Reviews mention this item in ratings only — no text feedback specifically about it yet.",
                "status": "neutral",
                "sentimentScore": 0,
                "reviewCount": len(reviews)
            }), 200

        avg_sentiment = sum(relevant_scores) / len(relevant_scores)
        complaint_ratio = len(negative_attributes) / len(relevant_scores)

        if avg_sentiment < -0.1 or complaint_ratio >= 0.5:
            most_common = Counter(negative_attributes).most_common(1)
            if most_common:
                top_issue  = most_common[0][0]
                suggestion = f"Critical alert: Frequent complaints mention '{top_issue}'. Suggest recipe review."
            else:
                suggestion = "Critical alert: Reviews trend negative, but no single recurring complaint word was detected. Manual review recommended."
            status = "warning"
        elif avg_sentiment > 0.4:
            suggestion = "Crowd favorite! No changes needed."
            status = "success"
        else:
            suggestion = "Balanced performance. No major issues detected."
            status = "neutral"

        return jsonify({
            "suggestion": suggestion,
            "sentimentScore": round(avg_sentiment, 2),
            "status": status,
            "reviewCount": len(reviews)
        })

    except Exception as e:
        print(f"Error in /analyze-menu-item: {str(e)}")
        return jsonify({"error": str(e)}), 500
 


@app.route('/analyze-sentiment', methods=['POST'])
def analyze_single_review():
    """
    Called by submitReview() in reviewController.js on each new review.
    Scores a single feedback string and returns label + score + keywords.
    """
    try:
        data = request.json
        text = data.get('text', '')

        if not text or len(text) < 3:
            return jsonify({
                "sentiment": "Neutral",
                "score": 0,
                "keywords": []
            }), 200

        scores = analyzer.polarity_scores(text)
        compound = scores['compound']

        if compound >= 0.05:
            label = "Positive"
        elif compound <= -0.05:
            label = "Negative"
        else:
            label = "Neutral"

        # Extract noun phrases as keywords
        doc = nlp(text)
        keywords = list({
            chunk.text.lower()
            for chunk in doc.noun_chunks
            if len(chunk.text) > 2
        })[:5]

        return jsonify({
            "sentiment": label,
            "score": round(compound, 4),
            "keywords": keywords
        }), 200

    except Exception as e:
        print(f"Error in /analyze-sentiment: {str(e)}")
        return jsonify({"sentiment": "Neutral", "score": 0, "keywords": []}), 500 

# Customer Segmentation
@app.route('/cluster-customers', methods=['POST'])
def cluster_customers():
    try:
        incoming_data = request.json.get('customers', [])
        if not incoming_data or len(incoming_data) < 3:
            return jsonify({"error": "Insufficient data"}), 400
 
        df = pd.DataFrame(incoming_data)
        df['lastVisit'] = pd.to_datetime(df['lastVisit'], utc=True)
        now = pd.Timestamp.now(tz='UTC')
        df['recency'] = (now - df['lastVisit']).dt.days
 
        features = df[['recency', 'totalOrders', 'totalSpent']]
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(features)
 
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        df['cluster'] = kmeans.fit_predict(scaled_features)
 
        avg_spending = df.groupby('cluster')['totalSpent'].mean()
        avg_recency  = df.groupby('cluster')['recency'].mean()
        vip_idx      = avg_spending.idxmax()
        at_risk_idx  = avg_recency.idxmax()
 
        def label_segment(cluster_id):
            if cluster_id == vip_idx:
                return "VIP"
            if cluster_id == at_risk_idx:
                return "At-Risk"
            return "Regular"
 
        df['segment'] = df['cluster'].apply(label_segment)
 
        return jsonify({
            "success": True,
            "clusters": {
                "vip_count":     int(df[df['segment'] == 'VIP'].shape[0]),
                "regular_count": int(df[df['segment'] == 'Regular'].shape[0]),
                "at_risk_count": int(df[df['segment'] == 'At-Risk'].shape[0])
            },
            "detailed_data": df[['_id', 'segment']].to_dict(orient='records')
        })
 
    except Exception as e:
        print(f"Error in /cluster-customers: {str(e)}")
        return jsonify({"error": str(e)}), 500
 
 
if __name__ == '__main__':
    app.run(port=5001, debug=True)