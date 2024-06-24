import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT;

const db = new pg.Client({
  connectionString:process.env.DATABASE_URL
});

db.connect();
//app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted(){
  const country = await db.query("SELECT country_code FROM visited_countries");
  let arr=[];
  country.rows.forEach((element) => {
    arr.push(element.country_code);
  });
  return arr;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs",{countries:countries, total:countries.length});
});

app.post("/add", async (req,res)=>{

  try{
    const add_country = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE LOWER('%' || $1 || '%')", 
      [req.body.country]
    );
    console.log(add_country.rows);
    if(add_country.rows.length > 1) 
      throw new Error("Be more specific");
    if(!add_country.rows[0].country_code)
      throw new Error("Country name does not exist");
    try{
      await db.query("INSERT INTO visited_countries (country_code) VALUES($1)",[add_country.rows[0].country_code]);
      res.redirect('/');
    }
    catch(err){
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs",{
        countries:countries,
        total:countries.length, 
        error: "Country has already been added, try again."
      })
    }
  }
  catch(err){
    if (err.message === "Be more specific") {
      // Handling "Be more specific" error
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "More than one country exists, try again with more specificity.",
    });
    } else {
      // Handling all other types of errors
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
    }
    
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
