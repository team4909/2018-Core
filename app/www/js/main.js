$(function () {
    const apiKey = tba.ApiClient.instance.authentications['apiKey'];
    apiKey.apiKey = 'poguusggy4HtnMS6jZI7nEASojzPhzhdIoBUGYUk4QzqZ0FjYiHZLugOhkVl0OKe';

    const matchApi = new tba.MatchApi();

    const templates = {
        container: $(".main"),
        dashboard: {
            template: Handlebars.compile($("#dashboard-template").html()),
            config: {
                "team_number": "4909",
                "api": true,
                "metadata": {
                    "event_match_key": "",
                    "alliances": {
                        blue: ["0000", "0000", "0000"],
                        red: ["0000", "0000", "0000"]
                    }
                }
            },
            init: () => {
                templates.dashboard.redraw();

                updateNextMatch();
            },
            redraw: () => {
                templates.container.html(templates.dashboard.template(templates.dashboard.config));

                $("#team_number").on("blur", (event) => {
                    templates.dashboard.config.team_number = $(event.target).text();

                    updateNextMatch();
                });

                $(".dashboard-team-number").on("blur", () => {
                    templates.dashboard.config.metadata.alliances = {
                        blue: [],
                        red: []
                    };

                    const per_alliance = $(".dashboard-team-number").length / 2;

                    $(".dashboard-team-number").each((index, object) => {
                        if (index < per_alliance)
                            templates.dashboard.config.metadata.alliances.red.push(object.textContent);
                        else
                            templates.dashboard.config.metadata.alliances.blue.push(object.textContent);
                    });

                    updateAnalysis();
                });
            }
        },
        schedule: {
            template: Handlebars.compile($("#schedule-template").html()),
            config: {
                "event_key": "2017marea"
            },
            init: () => {
                templates.schedule.redraw();
            },
            redraw: () => {
                if (navigator.onLine)
                    matchApi.getEventMatchesSimple(templates.schedule.config.event_key, {}, (err, data) => {
                        matches = data.sort((a, b) => {
                            return a.time - b.time;
                        }).map((datum) => {
                            return {
                                "match": datum.key.split("_")[1].toUpperCase(),
                                "time": readableDate(datum.time),
                                "alliances": mapTbaAlliances(datum.alliances)
                            };
                        });

                        const config = {
                            per_alliance: matches[0].alliances.red.length,
                            matches: matches
                        };

                        templates.container.html(templates.schedule.template(config));
                    });
                else
                    alert("Can't view Schedule Offline");
            }
        }
    };

    templates.dashboard.init();

    function updateNextMatch() {
        // TODO: Find Next Match
         matchApi.getTeamMatchesByYearSimple("frc"+templates.dashboard.config.team_number, config.season, {}, (err, data) => {
            
            if (!exists(err)) {
                if (exists(datum.predicted_time)) datum.time = datum.predicted_time;

                callback({
                    templates.dashboard.config.api = !exists(err);

                    templates.dashboard.redraw();

                    array.forEach(datum.predicted_time = data.sort(x)) => {
                    return x.datum.predicted.time - y.datum.predicted.time;
                }).map((datum) => {
                 
                    return {
                        "event_match_key": metadata.key.slice(4).replace("_", " ").toUpperCase(),
                        "time": readableDate(datum.predicted_time),
                        "alliances": mapTbaAlliances(datum.alliances), 
                        "match": datum.key.split("_")[1].toUpperCase()
                     }
                }  

            templates.dashboard.redraw();

            updateAnalysis();
        });
              }, err);

        } else {
                callback(undefined, err);
            }
        });
      }

    function updateAnalysis() {
        templates.dashboard.config.metadata.alliances.red.forEach((object, index) => {
            if (object == templates.dashboard.config.team_number) {
                templates.dashboard.config.metadata.alliance_color = "red";
                templates.dashboard.config.metadata.alliance_station = "Red " + (index + 1);
            }
        });

        templates.dashboard.config.metadata.alliances.blue.forEach((object, index) => {
            if (object == templates.dashboard.config.team_number) {
                templates.dashboard.config.metadata.alliance_color = "blue";
                templates.dashboard.config.metadata.alliance_station = "Blue " + (index + 1);
            }
        });

        templates.dashboard.redraw();
    }

    function getMatchSimple(event_match_key, callback) {
        matchApi.getMatchSimple(eventMatchKeyForYear(event_match_key), {}, (err, metadata) => {
            if (!exists(err)) {
                if (exists(metadata.predicted_time)) metadata.time = metadata.predicted_time;

                callback({
                    "event_match_key": metadata.key.slice(4).replace("_", " ").toUpperCase(),
                    "time": readableDate(metadata.time),
                    "alliances": mapTbaAlliances(metadata.alliances)
                }, err);
            } else {
                callback(undefined, err);
            }
        });
    }

    function readableDate(tbaTimestamp) {
        return moment(tbaTimestamp * 1000).format("hh:mm a").toUpperCase();
    }

    function eventMatchKeyForYear(event_match_key) {
        return config.season + event_match_key.replace(" ", "_").toLowerCase();
    }

    function mapTbaAlliances(alliances) {
        return {
            "blue": $.map(alliances.blue.team_keys, mapTeamKeyToTeamNum),
            "red": $.map(alliances.red.team_keys, mapTeamKeyToTeamNum)
        };
    }

    function mapTeamKeyToTeamNum(value) {
        return value.split("frc")[1];
    }

    function exists(object) {
        return typeof object != undefined && object != null;
    }

    $('.page-loader-wrapper').fadeOut();
});
