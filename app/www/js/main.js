$(function () {
    const apiKey = tba.ApiClient.instance.authentications['apiKey'];
    apiKey.apiKey = 'poguusggy4HtnMS6jZI7nEASojzPhzhdIoBUGYUk4QzqZ0FjYiHZLugOhkVl0OKe';

    const matchApi = new tba.MatchApi();

    const templates = {
        dashboard: Handlebars.compile($("#dashboard-template").html())
    };

    displayDashboard("1071", "MAREA_SF1M1", {
        blue: [],
        red: []
    });

    function displayDashboard(team_number, backup_event_match_key, backup_alliances) {
        function getNextMatchKey(team_number, callback) {
            callback(undefined, "Unimplemented Endpoint");
        }

        getNextMatchKey(team_number, (event_match_key, err) => {
            getMatchSimple(!exists(err) ? event_match_key : backup_event_match_key, (match_metadata, err) => {
                const template_config = {
                    "team_number": team_number,
                    "metadata": !exists(err) ? match_metadata : {
                        "event_match_key": backup_event_match_key,
                        "alliances": backup_alliances
                    }
                };

                template_config.metadata.alliances.red.forEach((object, index) => {
                    if (object == team_number) template_config.alliance_station = "Red " + (index + 1);
                });

                template_config.metadata.alliances.blue.forEach((object, index) => {
                    if (object == team_number) template_config.alliance_station = "Blue " + (index + 1);
                });


                // TODO: Compute Stats
                console.dir(template_config);

                $(".main").html(templates.dashboard(template_config));
            });
        });
    }

    function getMatchSimple(event_match_key, callback) {
        matchApi.getMatchSimple(eventMatchKeyForYear(event_match_key), {

        }, (err, metadata, response) => {
            if (!exists(err)) {
                if (exists(metadata.predicted_time)) metadata.time = metadata.predicted_time;

                function mapTeamKeys(value, index) {
                    return value.split("frc")[1];
                }

                callback({
                    "event_match_key": metadata.key.slice(4).replace("_", " ").toUpperCase(),
                    "time": moment(metadata.time).format("hh:mm a").toUpperCase(),
                    "alliances": {
                        "blue": $.map(metadata.alliances.blue.team_keys, mapTeamKeys),
                        "red": $.map(metadata.alliances.red.team_keys, mapTeamKeys)
                    }
                }, err);
            } else {
                callback(undefined, err);
            }
        });
    }

    function eventMatchKeyForYear(event_match_key) {
        return config.season + event_match_key.replace(" ", "_").toLowerCase();
    }

    function exists(object) {
        return typeof object != undefined && object != null;
    }

    $('.page-loader-wrapper').fadeOut();
});
