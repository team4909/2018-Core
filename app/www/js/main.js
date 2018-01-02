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
                    matchApi.getEventMatchesSimple(templates.schedule.config.event_key, {}, (err, matches) => {
                        templates.schedule.config.matches = sortTbaMatchRecordsByTime(matches);
                        templates.schedule.config.per_alliance = templates.schedule.config.matches[0].alliances.red.length;

                        templates.container.html(templates.schedule.template(templates.schedule.config));
                    });
                else
                    alert("Can't view Schedule Offline");
            }
        }
    };

    templates.dashboard.init();

    function updateNextMatch() {
        matchApi.getTeamMatchesByYearSimple("frc" + templates.dashboard.config.team_number, config.season, {}, (err, matches) => {
            // assume error, set to true if next match found
            templates.dashboard.config.api = false;

            if(!exists(err)) {
                const unixNow = moment().unix();
                
                // Parse TBA Record, Sort by Time and Return Next Match
                const nextMatch = sortTbaMatchRecordsByTime(matches).find(m => m.epoch_time > unixNow);

                if (exists(nextMatch)) {
                    templates.dashboard.config.api = true;

                    templates.dashboard.config.metadata = nextMatch;

                    // Only run Analysis if Metadata found
                    updateAnalysis();
                }
            }

            templates.dashboard.redraw();
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
    
    function sortTbaMatchRecordsByTime(records){
        return records.map(parseTbaMatchRecord).sort((a, b) => a.epoch_time - b.epoch_time);
    }
    
    // Converts a TBA simple match record to the TGA format
    function parseTbaMatchRecord(metadata) {
        return {
            "event_match_key": metadata.key.slice(4).replace("_", " ").toUpperCase(),
            "match": metadata.key.split("_")[1].toUpperCase(),
            "epoch_time": metadata.predicted_time || metadata.time,
            "time": readableDate(metadata.predicted_time || metadata.time),
            "alliances": mapTbaAlliances(metadata.alliances)
        };
    }

    function readableDate(tbaTimestamp) {
        return moment(tbaTimestamp * 1000).format("hh:mm a").toUpperCase();
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
