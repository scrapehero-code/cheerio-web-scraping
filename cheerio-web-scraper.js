const axios = require("axios");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");

const productPageUrls = [];
const productDataFields = [];

// Function to extract product page URLs from listing page
async function getProductUrls(listingUrl) {
  try {
    const { data } = await axios.get(listingUrl);
    const parser = cheerio.load(data);
    const products = parser("li.product");

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productPageUrl = parser(product).find("a").attr("href");
      productPageUrls.push(productPageUrl);
    }
  } catch (error) {
    console.error(error);
  }
}

// Function to extract data from product page
async function getProductData(productPageUrl) {
  try {
    const { data } = await axios.get(productPageUrl);
    const parser = cheerio.load(data);

    const description = parser(
      "div.woocommerce-product-details__short-description"
    ).text();
    const title = parser("h1.product_title").text();
    const price = parser("p.price>span.woocommerce-Price-amount.amount").text();
    const stock = parser("p.stock.in-stock").text();
    const sku = parser("span.sku").text();
    const imageUrl = parser("figure>div>a").attr("href");

    if (title && price && stock && sku && imageUrl && description) {
      return { title, price, stock, sku, imageUrl, description };
    } else {
      console.error(`Error: Missing required data from ${productPageUrl}`);
      return {};
    }
  } catch (error) {
    console.error(error);
  }
}

// main function
async function main() {
  let pages = 2;
  for (let i = 1; i <= pages; i++) {
    listingUrl = "https://scrapeme.live/shop/page/" + String(i);
    await getProductUrls(listingUrl);
  }
  for (let i = 0; i < productPageUrls.length; i++) {
    productDataFields.push(await getProductData(productPageUrls[i]));
  }
  await save_to_csv(productDataFields);
  console.log(productDataFields);
}

async function save_to_csv(data) {
  const csv = new ObjectsToCsv(data);
  csv.toDisk("product_page_data.csv");
}

main();
