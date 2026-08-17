const QRCode = require('qrcode');

// Generate QR for a specific table
exports.generateTableQR = async (req, res) => {
  try {
    const { restaurantId, tableNumber } = req.body;

    // Define the Customer Frontend URL
    const baseUrl = process.env.CUSTOMER_URL || "https://order.myapp.com";
    const qrData = `${baseUrl}/menu?rid=${restaurantId}&t=${tableNumber}`;

    // Generate Data URL (Base64 image)
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      color: {
        dark: '#3269E6', 
        light: '#FFFFFF'
      },
      width: 512,
      margin: 2
    });

    res.status(200).json({
      success: true,
      qrCodeImage,
      url: qrData
    });
  } catch (error) {
    res.status(500).json({ message: "QR Generation Failed" });
  }
};