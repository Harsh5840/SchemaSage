
import express from 'express';
import mainrouter from './routes/main.js';
const app = express();
const port = process.env.PORT || 5000;
import cors from 'cors';






app.use(cors());
app.use(express.json());
app.use("/api", mainrouter);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});