async function fetchUrlJson(url) {
  try {
    const result = await fetch(url);
    return result.json();
  } catch (err) {
    console.error('Error while fetching url', { err });
    throw new Error('fetch-error');
  }
}

function mapGameResult(game) {
  return {
    publisherId: game.publisher_id,
    name: game.name,
    platform: game.os,
    storeId: game.appId,
    bundleId: game.bundle_id,
    appVersion: game.version,
    isPublished: new Date(game.release_date).getTime() < new Date(),
  };
}

function processFetchedGamesDataList(list, gameListSize) {
  const mappedList = [];
  let processedGames = 0;
  for (const games of list) {
    for (const game of games) {
      if (processedGames < gameListSize) {
        const mappedGame = mapGameResult(game);
        mappedList.push(mappedGame);
        processedGames += 1;
      }
    }
  }
  return mappedList;
}

module.exports = { processFetchedGamesDataList, fetchUrlJson };
