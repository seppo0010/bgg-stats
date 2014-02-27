var bgg = require('bgg');
var fs = require('fs');

try {
  fs.mkdirSync('data');
} catch (e) {}

var users = ['seppo0010', 'flomincucci', 'saaruman', 'MilenioOscuro', 'GnzLh',
    'SebasKO', 'SebasKO', 'Charlodes', 'toote', 'xapi', 'ToshiroBudini',
    'frater82', 'agonar', 'Kassapa', 'Nordico', 'Earnur', 'Monk74'];

var get_game = function(thing_id, callback) {
  var path = 'data/thing-' + thing_id;
  fs.exists(path, function(exists) {
    if (exists) {
      fs.readFile(path, function(err, data) {
        if (callback) {
          var d = JSON.parse(data);
          d.id = thing_id;
          callback(d);
        }
      });
    } else {
      bgg('thing', {id: thing_id})
        .then(function(results) {
          var data = {
            id: thing_id,
            name: (
                   results.items.item.name.value ||
                   results.items.item.name[0].value),
            description: results.items.item.description,
            playingtime: results.items.item.playingtime.value,
            minplayers: results.items.item.minplayers.value,
            maxplayers: results.items.item.maxplayers.value,
            thumbnail: results.items.item.thumbnail
          };
          var types = {};
          results.items.item.link.forEach(function(link) {
            if (!types[link.type]) types[link.type] = [];
            types[link.type].push(link.value);
          });
          data.types = types;
          fs.writeFile(path, JSON.stringify(data || []));
          if (callback) callback(data);
        });
    }
  });
};

var get_collection = function(username, callback) {
  var path = 'data/collection-' + username;
  fs.exists(path, function(exists) {
    if (exists) {
      fs.readFile(path, function(err, data) {
        if (callback) callback(JSON.parse(data));
      });
    } else {
      bgg('collection', {username: username, stats: 1})
        .then(function(results) {
          fs.writeFile(path, JSON.stringify(results.items.item || []));
          if (callback) callback(results.items.item);
        });
    }
  });
};

var games_owned = {};
var games_rating = {};
var games_rating_count = {};
var games_per_designer = {};
var games_designer = {};
var games_designer_count = {};
var uc = 0;
var gc = 0;
users.forEach(function(user) {
  uc++;
  get_collection(user, function(things) {
    things.forEach(function(item) {
      if (item.objecttype == 'thing') {
        var r = parseInt(item.stats.rating.value);
        if (item.status.own) {
          if (!games_owned[item.objectid]) games_owned[item.objectid] = 0;
          games_owned[item.objectid]++;
        }
        if (!games_rating[item.objectid]) {
          games_rating[item.objectid] = 0;
          games_rating_count[item.objectid] = 0;
        }
        if (r > 0) {
          games_rating[item.objectid] += r;
          games_rating_count[item.objectid]++;
          gc++;
          get_game(item.objectid, function(game) {
            (game.types.boardgamedesigner || []).forEach(function(d) {
              if (!games_per_designer[d]) {
                games_per_designer[d] = [];
              }
              if (!games_designer[d]) {
                games_designer[d] = 0;
                games_designer_count[d] = 0;
              }
              games_designer[d] += r;
              games_designer_count[d]++;
              if (games_per_designer[d].indexOf(game.name) == -1)
                games_per_designer[d].push(game.name);
            });
            if (gc-- == 1) {
              for (designer in games_designer_count) {
                if (games_designer_count[designer] > 2)
                  console.log(
                    [
                    'designer',
                    designer,
                    games_designer_count[designer],
                    games_designer[designer] / games_designer_count[designer],
                    games_per_designer[designer].join('\t')
                    ].join('\t')
                    );
              }
            }
          });
        }
      }
    });
    if (uc-- == 1) {
      for (game_id in games_owned) {
        get_game(game_id, function(game) {
          console.log(
              [
              'game owned',
              game.name,
              games_owned[game.id]
              ].join('\t')
              );
        });
      }
      for (game_id in games_rating_count) {
        if (games_rating_count[game_id] > 2)
          get_game(game_id, function(game) {
            console.log(
                [
                'game voted',
                game.name,
                games_rating_count[game.id],
                games_rating[game.id] / games_rating_count[game.id]
                ].join('\t')
                );
          });
      }
    }
  });
});
