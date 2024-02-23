import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import randomstring from "randomstring";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "authenticating",
  password: "Prachi@22",
  port: 5432,
});
db.connect();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // use 465 for implicit SSL/TLS
  secure: true,
  auth: {
    user: 'Your_mail',
    pass: '****', //your mail_password
  },
});
console.log(transporter);
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); 
app.use(express.static("Public"));

app.get('/', (req, res) => {
  res.render('initial.ejs');
});

// For company---------------------------------------------------------------------------------------
app.get('/company', (req, res) => {
  res.render('company.ejs');
});

var company_rupees=0;
app.post('/postjob', async (req, res)=>{
  const companyName = req.body.companyName;
  const logo=req.body.logo;
  const JobTitle=req.body.JobTitle;
  const Minimum_CTC=req.body.Minimum_CTC;
  const Maximum_CTC=req.body.Maximum_CTC;
  const location=req.body.location;
  company_rupees += 200;
  await db.query(
    'INSERT INTO company_details (company_name, logo, job_title, Minimum_CTC, Maximum_CTC, location, total_rupees) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
    [companyName, logo, JobTitle, Minimum_CTC, Maximum_CTC, location, company_rupees]);
  
  console.log(req.body)
  res.render('companyJobPage.ejs', {details: req.body, company_rupees});
});
  

//For User------------------------------------------------------------------------------------------------------
app.get('/user', (req, res) => {
  res.render('otp.ejs');
});

app.post('/generate-otp', async (req, res)=>{
  const email=req.body.mail;
  try {
    const otp = randomstring.generate(6);
    const otpExpiresAt = new Date()

    db.query(
      'INSERT INTO users (email, otp, otp_expires_at) VALUES ($1, $2, $3)',
      [email, otp, otpExpiresAt]
    );

    const mailOptions = {
      from: 'Your_mail',
      to: email,
      subject: 'OTP for Registration',
      text: `Your OTP is: ${otp}`,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Failed to send OTP.');
      } else {
        console.log('Email sent: ' + info.response);
        // res.status(200).send('OTP sent successfully.');
        res.render('register.ejs', { email });
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error.');
  }

})

app.post('/register', async (req, res) => {
  const otp=req.body.otp;
  try {
    const result = await db.query('SELECT * FROM users WHERE otp = $1', [otp]);
    
    if (result.rows.length > 0 && result.rows[0].otp == otp) {
      // res.status(200).send('OTP verified successfully.');
      const user_coins = 300;
      await db.query('INSERT INTO users (user_coins) VALUES ($1)', [user_coins])
        
      
      const company_details = await db.query('SELECT * FROM company_details');
      res.render('userApplyPage.ejs', { companyDetails: company_details.rows, coin:user_coins});
      console.log(result.rows[0].email, result.rows[0].otp);

    } else {
      res.status(400).send('Invalid OTP');
      res.redirect('/')
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error.');
  }


  
  
  
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});