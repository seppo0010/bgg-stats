var bgg = require('bgg');
var fs = require('fs');

try {
  fs.mkdirSync('data');
} catch (e) {}

var users = ['seppo0010', 'flomincucci', 'saaruman', 'MilenioOscuro', 'GnzLh',
    'SebasKO', 'SebasKO', 'Charlodes', 'toote', 'xapi', 'ToshiroBudini',
    'frater82', 'agonar', 'Kassapa', 'Nordico', 'Earnur', 'Monk74', 'barbazul',
    'yukata'];


var maxFilesInFlight = 100;
var origRead = fs.readFile;
var origWrite = fs.writeFile;

var activeCount = 0;
var pending = [];

var wrapCallback = function(cb) {
    return function() {
        activeCount--;
        cb.apply(this, Array.prototype.slice.call(arguments));
        if (activeCount < maxFilesInFlight && pending.length) {
            pending.shift()();
        }
    };
};

/**
 */
fs.readFile = function() {
    var args = Array.prototype.slice.call(arguments);
    if (activeCount < maxFilesInFlight) {
        if (args[1] instanceof Function) {
            args[1] = wrapCallback(args[1]);
        } else if (args[2] instanceof Function) {
            args[2] = wrapCallback(args[2]);
        }
        activeCount++;
        origRead.apply(fs, args);
    } else {
        pending.push(function() {
            fs.readFile.apply(fs, args);
        });
    }
};

/**
 */
fs.writeFile = function() {
    var args = Array.prototype.slice.call(arguments);
    if (activeCount < maxFilesInFlight) {
        if (args[1] instanceof Function) {
            args[1] = wrapCallback(args[1]);
        } else if (args[2] instanceof Function) {
            args[2] = wrapCallback(args[2]);
        }
        activeCount++;
        origWrite.apply(fs, args);
    } else {
        pending.push(function() {
            fs.writeFile.apply(fs, args);
        });
    }
};

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
var games_per_designer = {};
var games_designer = {};
var games_designer_count = {};
var games_mechanic = {};
var games_mechanic_count = {};
var games_publisher = {};
var games_publisher_count = {};
var user_collection = {};
var uc = 0;
var gc = 0;
users.forEach(function(user) {
  uc++;
  get_collection(user, function(things) {
    user_collection[user] = {own: 0, sum_votes: 0, num_votes: 0};
    things.forEach(function(item) {
      if (item.objecttype == 'thing') {
        var r = parseInt(item.stats.rating.value);
        if (item.status.own) {
          if (!games_owned[item.objectid]) games_owned[item.objectid] = 0;
          games_owned[item.objectid]++;
          user_collection[user].own++;
        }
        if (!games_rating[item.objectid]) {
          games_rating[item.objectid] = 0;
          games_rating_count[item.objectid] = 0;
        }
        if (r > 0) {
          user_collection[user].sum_votes += r;
          user_collection[user].num_votes++;
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
            (game.types.boardgamemechanic || []).forEach(function(d) {
              if (!games_mechanic[d]) {
                games_mechanic[d] = 0;
                games_mechanic_count[d] = 0;
              }
              games_mechanic[d] += r;
              games_mechanic_count[d]++;
            });
            (game.types.boardgamepublisher || []).forEach(function(d) {
              if (!games_publisher[d]) {
                games_publisher[d] = 0;
                games_publisher_count[d] = 0;
              }
              games_publisher[d] += r;
              games_publisher_count[d]++;
            });
            if (gc-- == 1) {
              for (mechanic in games_mechanic_count) {
                if (games_mechanic_count[mechanic] > 2)
                  console.log(
                    [
                    'mechanic',
                    mechanic,
                    games_mechanic_count[mechanic],
                    games_mechanic[mechanic] / games_mechanic_count[mechanic]
                    ].join('\t')
                    );
              }
              for (publisher in games_publisher_count) {
                if (games_publisher_count[publisher] > 2)
                  console.log(
                    [
                    'publisher',
                    publisher,
                    games_publisher_count[publisher],
                    (games_publisher[publisher] /
                     games_publisher_count[publisher])
                    ].join('\t')
                    );
              }
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
      for (user in user_collection) {
        console.log(
            [
            'user',
            user,
            user_collection[user].own,
            user_collection[user].num_votes,
            user_collection[user].num_votes == 0 ? '-' : (
              user_collection[user].sum_votes / user_collection[user].num_votes)
            ].join('\t')
            );
      }
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
