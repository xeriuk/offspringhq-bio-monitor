const cheerio = require("cheerio");
const request = require("cloudscraper");
const Discord = require("discord.js");
const util = require("util"),
  fs = require("fs"),
  readdir = util.promisify(fs.readdir);

const config = require("./config.json");

const low = require("lowdb");
const filesync = require("lowdb/adapters/FileSync");

const adapter = new filesync(__dirname + "/data.json");
const db = low(adapter);

const scrapingFunction = require("./utils/scraping");
const proxyFunctions = require("./utils/proxies");

db.defaults({ users: [] }).write();

const check = async function () {
  const offspring = db
    .get("users")
    .find({
      username: "offspringhq",
    })
    .value();
  // read proxies file
  const text = fs.readFileSync(process.cwd() + "/proxy.txt", "utf-8");
  const proxies =
    text == ""
      ? []
      : proxyFunctions.formatProxy(text.replace(/\r/g, "").trim().split("\n"));

  console.log(`Loaded ${proxies.length} proxies!`);
  setInterval(async () => {
    // choose a random proxies per account
    const randomProxy = proxyFunctions.getRandomProxy(proxies);
    const result = await scrapingFunction.scrapeUser(
      "offspringhq",
      randomProxy
    );
    if (result) {
      let bio = "";
      const $ = cheerio.load(result);
      const obj = $("script[type='application/ld+json']");
      try {
        for (const i in obj) {
          for (const j in obj[i].children) {
            const data = obj[i].children[j].data;
            if (data) {
              const json = JSON.parse(data);
              bio = JSON.stringify(json.description);
              if (bio !== offspring.bio) {
                console.log("bio changed");
                db.get("users")
                  .find({ username: "offspringhq" })
                  .assign({
                    bio: bio,
                  })
                  .write();
                const embed = new Discord.MessageEmbed();
                embed.setColor("#463A9C");
                embed.setTitle(`Bio changed`); // Calling method setTitle on constructor.
                embed.setURL(`https://www.instagram.com/offspringhq`);
                embed.setAuthor(
                  "offspringhq",
                  "https://i.imgur.com/HXsOGpB.jpg",
                  `https://www.instagram.com/offspringhq`
                );
                embed.setDescription(json.description);
                embed.setTimestamp(Date.now());
                embed.setFooter("Xmonitors • Xeriuk#5224");
                const webhook = new Discord.WebhookClient(
                  config.webhookID,
                  config.webhookSecret
                );
                await webhook
                  .send("", {
                    username: "OffspringHQ",
                    avatarURL: "https://i.imgur.com/HXsOGpB.jpg",
                    embeds: [embed],
                  })
                  .then(() => {
                    return;
                  })
                  .catch((err) => {
                    console.dir(err);
                  });
              }
              return;
            }
            return;
          }
        }
        if (bio !== "") {
          console.log(bio);
          return;
        }
      } catch (e) {
        console.dir(e);
        return;
      }
    }
  }, 5000);
};

check();
