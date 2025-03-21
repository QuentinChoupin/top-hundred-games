const express = require('express');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
const db = require('./models');
const { isString } = require('./helpers');
const { fetchUrlJson, processFetchedGamesDataList } = require('./service/games');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then((games) => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

app.post('/api/games/search', (req, res) => {
  const queryParams = {
    ...(isString(req.body.name) && { name: {
      [Op.like]: `%${req.body.name}%`,
    } }),
    ...(isString(req.body.platform) && {
      platform: {
        [Op.like]: `${req.body.platform}`,
      },
    }),
  };

  return db.Game.findAll({
    where: queryParams,
  }).then((games) => res.status(200).send(games))
    .catch((err) => {
      console.log('***Error searching games', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.post('/api/games/populate', async (req, res) => {
  const gamesUrlsPromises = [
    fetchUrlJson('https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json'),
    fetchUrlJson('https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json'),
  ];
  const fetchedGameList = await Promise.all(gamesUrlsPromises);
  const gameListSize = 100;
  let mappedGameList = [];
  for (const gameList of fetchedGameList) {
    mappedGameList = mappedGameList.concat(processFetchedGamesDataList(gameList, gameListSize));
  }
  await db.Game.bulkCreate(mappedGameList);
  res.status(200);
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
