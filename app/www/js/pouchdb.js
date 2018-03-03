const db = new PouchDB("tga-2018");

db.sync(`http://admin:password@the-green-alliance.local:5984/tga-2018`, {
    live: true,
    retry: true
}).on('error', function (err) {
    console.error(`Replication Error: ${JSON.stringify(err)}`);
});

db.sync(`http://${localStorage.getItem('username')}:${localStorage.getItem('password')}@tga-cloud.team4909.org:5984/tga-2018`, {
    live: true,
    retry: true
}).on('error', function (err) {
    console.error(`Replication Error: ${JSON.stringify(err)}`);
});

function getDatabaseMatches(callback) {
    db.allDocs({
        include_docs: true
    }).then((docs) => {
        matches = _.map(docs.rows, function (match) {
            return match.doc;
        });
        matches = _.reject(matches, function (match) {
            return match.event_key == "practice";
        });
        matches = _.reject(matches, function (match) {
            return match._id.indexOf("_design") > -1;
        });
        matches = _.map(matches, function (match) {
            match["grouping_key"] = match["event_key"].toUpperCase() + match["team_number"];

            return match;
        });

        headers = [
            "Event Key", "Team #", "Match",
            "Line Cross", "Opp. Auto", "Auto. Switch", "Auto. Scale", "Auto. Exchange",
            "Teleop. Switch", "Teleop. Scale", "Teleop. Exchange",
            "Teleop. from Portal", "Teleop. from Floor", "Teleop. Dropped",
            "Platform", "Climbed", "Lifted", "Lifted Others",
            "Cube Placing", "Bad Driving", "Top Heavy", "Disabled",
            "Robot Failure", "Carded", "Foul", "Not Present"
        ];

        headers = _.map(headers, function (header) {
            return {
                title: header
            };
        });

        matchesArray = _.map(matches, function (match) {
            return [
                match["event_key"].toUpperCase(),
                match["team_number"],
                (match["match_type"] + match["match_number"] + (match["match_type_number"] ? "m" + match.match_type_number : "")).toUpperCase(),

                match["auto_crossed_line"],
                match["comments_opponent_auto"],
                match["auto_cubes_on_switch"],
                match["auto_cubes_on_scale"],
                match["auto_cubes_exchanged"],

                match["teleop_cubes_on_switch"],
                match["teleop_cubes_on_scale"],
                match["teleop_cubes_exchanged"],
                match["teleop_cubes_from_portal"],
                match["teleop_cubes_from_floor"],
                match["teleop_cubes_dropped"],

                match["endgame_platform"],
                match["endgame_climbed"],
                match["endgame_lifted_by_partners"],
                match["endgame_lifted_partners"],
        
                match["comments_accurate_cube_placer"],
                match["comments_reckless_driving"],
                match["comments_top_heavy"],
                match["comments_disabled"],
                match["comments_robot_failure"],
                match["comments_card"],
                match["comments_foul"],
                match["comments_not_present"]
            ];
        });

        callback(headers, matchesArray, matches);
    });
}

function getDatabaseAverages(callback) {
    getDatabaseMatches((headers, matchesArray, matches) => {
        averages = _.groupBy(matches, function (match) {
            return match["grouping_key"];
        });

        averages = _.map(averages, function (matches) {
            /* BASED ON https://codereview.stackexchange.com/a/141533 */
            var averagesCalc = Array.from(matches.reduce(
                    (acc, obj) => Object.keys(obj).reduce(
                        (acc, key) => typeof obj[key] == "number" ?
                        acc.set(key, ( // immediately invoked function:
                            ([sum, count]) => [sum + obj[key], count + 1]
                        )(acc.get(key) || [0, 0])) // pass previous value
                        :
                        acc,
                        acc),
                    new Map()),
                ([key, [sum, count]]) => ({
                    key,
                    value: (sum / count).toFixed(2)
                })
            );
        
            averages = {
                event_key: matches[0]["event_key"],
            };
            
            averagesCalc.forEach((e,i) => {
                averages[e.key] = e.value
            });
            
            averages.team_number = matches[0]["team_number"];
            
            // RIP out Metadata
            averages.grouping_key = undefined;
            averages.match_number = undefined;
            averages.match_type = undefined;
            averages.match_type_number = undefined;
            averages.scout_initials = undefined;
            averages.scout_team = undefined;
            
            return averages;
        });
        
        headers = [
            "Event Key", "Team #",
            "Line Cross", "Opp. Auto", "Auto. Switch", "Auto. Scale", "Auto. Exchange",
            "Teleop. Switch", "Teleop. Scale", "Teleop. Exchange",
            "Teleop. from Portal", "Teleop. from Floor", "Teleop. Dropped",
            "Platform", "Climbed", "Lifted", "Lifted Others",
            "Cube Placing", "Bad Driving", "Top Heavy", "Disabled",
            "Robot Failure", "Carded", "Foul", "Not Present"
        ];

        headers = _.map(headers, function (header) {
            return {
                title: header
            };
        });

        matchesArray = _.map(averages, function (match) {
            return [
                match["event_key"].toUpperCase(),
                match["team_number"],

                match["auto_crossed_line"],
                match["comments_opponent_auto"],
                match["auto_cubes_on_switch"],
                match["auto_cubes_on_scale"],
                match["auto_cubes_exchanged"],

                match["teleop_cubes_on_switch"],
                match["teleop_cubes_on_scale"],
                match["teleop_cubes_exchanged"],
                match["teleop_cubes_from_portal"],
                match["teleop_cubes_from_floor"],
                match["teleop_cubes_dropped"],

                match["endgame_platform"],
                match["endgame_climbed"],
                match["endgame_lifted_by_partners"],
                match["endgame_lifted_partners"],
        
                match["comments_accurate_cube_placer"],
                match["comments_reckless_driving"],
                match["comments_top_heavy"],
                match["comments_disabled"],
                match["comments_robot_failure"],
                match["comments_card"],
                match["comments_foul"],
                match["comments_not_present"]
            ];
        });
        
        callback(headers, matchesArray);
    });
}
