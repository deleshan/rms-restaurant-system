FROM python:3.11-slim

# build-essential covers any packages needing compilation (safe default)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the spacy model and NLTK data into the image at BUILD time,
# not runtime — avoids your current setup_nltk()/os.system() fallback
# ever needing to hit the network when the container starts.
RUN python -m spacy download en_core_web_sm
RUN python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt'); nltk.download('punkt_tab')"

COPY . .

EXPOSE 5001

# gunicorn imports the `app` object directly — your `if __name__ == '__main__': app.run(debug=True)`
# block never executes, so debug mode is never live in this container.
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5001", "--timeout", "120", "app:app"]