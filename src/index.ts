import express from 'express';
import * as dotenv from 'dotenv';
import { routes } from "@/routes/index";

dotenv.config();

const app = express();



//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
routes(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
