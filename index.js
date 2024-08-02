import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import midtransClient from 'midtrans-client';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Konfigurasi Midtrans client
const apiClient = new midtransClient.Snap({
    isProduction: false,
    serverKey: 'SB-Mid-server-aVSYun8nN8bkx0Dg3aacu-Sn', 
    clientKey: 'SB-Mid-client-hs8Br2aO6nF6Fr4q'  
});

// Handler untuk GET request di endpoint root
app.get('/', (req, res) => {
    res.send('Server is running.');
});

// Handler untuk notifikasi Midtrans
app.post('/', async (req, res) => {
    try {
        const notificationJson = req.body;

        // Proses notifikasi menggunakan Midtrans client
        const statusResponse = await apiClient.transaction.notification(notificationJson);
        const { order_id: orderId, transaction_status: transactionStatus, fraud_status: fraudStatus } = statusResponse;

        // Log informasi yang diterima
        console.log(`Received notification for Order ID: ${orderId}`);
        console.log(`Transaction Status: ${transactionStatus}`);
        console.log(`Fraud Status: ${fraudStatus}`);

        // Data yang akan dikirim ke Firebase
        const firebaseUrl = `https://skripsi-tiket-ece21-default-rtdb.asia-southeast1.firebasedatabase.app/transaksi/${orderId}.json`;
        const dataToSend = { orderId, transactionStatus };

        // Mengirim data ke Firebase
        const response = await fetch(firebaseUrl, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
            console.log('Data successfully sent to Firebase');
            res.status(200).send('OK');
        } else {
            const errorBody = await response.text();
            console.error(`Failed to send data to Firebase. Response: ${errorBody}`);
            res.status(500).send('Failed to process notification');
        }
    } catch (error) {
        console.error('Error processing notification:', error);
        res.status(500).send('Failed to process notification');
    }
});

// Mulai server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
