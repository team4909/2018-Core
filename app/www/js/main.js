$(applicationCache).bind(
    "cached",
    function (event) {
        alert("The Green Alliance Scouting Platform has been successfully cached on your device!");
    }
);

$(function () {
    const apiKey = tba.ApiClient.instance.authentications['apiKey'];
    apiKey.apiKey = 'poguusggy4HtnMS6jZI7nEASojzPhzhdIoBUGYUk4QzqZ0FjYiHZLugOhkVl0OKe';
    const matchApi = new tba.MatchApi();

    $(".navigation li[data-page]").click((event) => {
        const page = $(event.currentTarget).attr("data-page");

        $(`.content div[data-page]`).hide();
        $(`.content div[data-page='${page}']`).show();

        $(`.navigation li[data-page]`).removeClass("active");
        $(`.navigation li[data-page='${page}']`).addClass("active");
    });

    $('#wizard_horizontal').steps({
        headerTag: 'h2',
        bodyTag: 'section',
        transitionEffect: 'slideLeft',
        onFinished: function (event, currentIndex) {
            match = {
                "event_key": localStorage.getItem("event"),
                "match_number": Number($(`#m-number`).val()),
                "match_type": $('input[name=match-type]:checked').val(),
                "match_type_number": Number($(`#m-sub-number`).val()),
                "team_number": Number($(`#m-scouted`).val()),
                "scout_team": Number($(`#m-scouting`).val()),
                "scout_initials": $(`#m-scout`).val(),

                "auto_crossed_line": Number($("#crossed-the-line").prop("checked")),
                "auto_cubes_on_switch": Number($(`input[data-counter='auto_cubes_switch']`).val()),
                "auto_cubes_on_scale": Number($(`input[data-counter='auto_cubes_scale']`).val()),
                "auto_cubes_exchanged": Number($(`input[data-counter='auto_cubes_exchange']`).val()),

                "teleop_cubes_on_switch": Number($(`input[data-counter='tele_cubes_switch']`).val()),
                "teleop_cubes_on_scale": Number($(`input[data-counter='tele_cubes_scale']`).val()),
                "teleop_cubes_exchanged": Number($(`input[data-counter='tele_cubes_exchange']`).val()),
                "teleop_cubes_from_portal": Number($(`input[data-counter='tele_cubes_player']`).val()),
                "teleop_cubes_from_floor": Number($(`input[data-counter='tele_cubes_floor']`).val()),
                "teleop_cubes_dropped": Number($(`input[data-counter='tele_cubes_dropped']`).val()),

                "endgame_platform": Number($("#drove-on-platform").prop("checked")),
                "endgame_climbed": Number($("#climbed").prop("checked")),
                "endgame_lifted_by_partners": Number($("#lifted-by-partners").prop("checked")),
                "endgame_lifted_partners": Number($("#lifted-partners").prop("checked")),

                "comments_accurate_cube_placer": Number($("#accurate-cube-placer").prop("checked")),
                "comments_opponent_auto": Number($("#opponent-auto").prop("checked")),
                "comments_not_present": Number($("#not-present").prop("checked")),
                "comments_disabled": Number($("#disabled").prop("checked")),
                "comments_robot_failure": Number($("#robot-failure").prop("checked")),
                "comments_top_heavy": Number($("#top-heavy").prop("checked")),
                "comments_reckless_driving": Number($("#reckless-driving").prop("checked")),
                "comments_foul": Number($("#foul").prop("checked")),
                "comments_card": Number($("#carded").prop("checked"))
            };

            match["_id"] = "2018" + match.event_key + "_" + match.match_type + match.match_number + (match.match_type_number ? "m" + match.match_type_number : "") + "_" + match.team_number;
            match["_id"] = match["_id"].toLowerCase();

            db.put(match);

            if (!!window.cordova) {
                bluetooth.sendData(JSON.stringify(match), console.log, console.error);
            }

            // Clear Form
            $(`.match-metadata`).val("");
            $(`input[data-counter]`).val("0");
            $(`input[type='checkbox']`).prop("checked", false);
            $('#wizard_horizontal').steps('restart')
        }
    });

    $(`#m-event-key`).val(localStorage.getItem("event"));

    window.addEventListener('online', function (e) {
        $(".online-only").show();
        $("#team_number").text("0000");
        $("#team_number").attr("contenteditable", "true");
    });

    window.addEventListener('offline', function (e) {
        $(".online-only").hide();
        $("#team_number").text("Offline - N/A");
        $("#team_number").removeAttr("contenteditable");
    });

    if (navigator.onLine != true) {
        window.dispatchEvent(new Event('offline'));
    } else {
        window.dispatchEvent(new Event('online'));
    }

    $("#team_number").on("focus", () => {
        if ($("#team_number").text() == "0000")
            $("#team_number").text("");
    });

    $("body").on('DOMSubtreeModified', "#team_number", function () {
        if ($("#team_number").text() == "")
            $("#team_number").text("0000");

        $(".online-only").hide();

        getNextTeamMatch($("#team_number").text(), (match) => {
            if (match != undefined) {
                $(".online-only").show();

                $("#match_key").text(match.event_match_key);
                $("#match_time").text(match.time);
            }
        });
    });
    $("#team_number").trigger("DOMSubtreeModified");

    $("#m-event-key").val(localStorage.getItem("event")).on("change", () => {
        localStorage.setItem("event", $("#m-event-key").val());
    });

    $("#conf-un").val(localStorage.getItem("username")).on("change", () => {
        localStorage.setItem("username", $("#conf-un").val());
    });

    $("#conf-pw").val(localStorage.getItem("password")).on("change", () => {
        localStorage.setItem("password", $("#conf-pw").val());
    });

    $("#conf-bt-mac").hide();
    document.addEventListener("deviceready", () => {
        $("#conf-bt-mac").val(localStorage.getItem("mac_addr")).on("change", () => {
            localStorage.setItem("mac_addr", $("#conf-bt-mac").val());

            bluetooth.initConnection(localStorage.getItem("mac_addr"), console.log, console.error);
        }).trigger("change");

        $("#conf-bt-mac").show();
    }, false);

    function getNextTeamMatch(team, callback) {
        matchApi.getTeamMatchesByYearSimple("frc" + team, 2017, {}, (err, matches) => {
            if (!exists(err)) {
                const unixNow = 0;
                moment().unix();

                // Parse TBA Record, Sort by Time and Return Next Match
                const nextMatch = sortTbaMatchRecordsByTime(matches).find(m => m.epoch_time > unixNow);

                callback(nextMatch);
            }
        });
    }

    function sortTbaMatchRecordsByTime(records) {
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

    $("button[data-type='minus']").click((event) => {
        const counter = $(event.currentTarget).attr("data-counter");
        const existing = Number($(`input[data-counter='${counter}']`).val());

        if (existing > 0)
            $(`input[data-counter='${counter}']`).val(existing - 1);
    });

    $("button[data-type='plus']").click((event) => {
        const counter = $(event.currentTarget).attr("data-counter");

        $(`input[data-counter='${counter}']`).val(Number($(`input[data-counter='${counter}']`).val()) + 1);
    });
    $('.page-loader-wrapper').fadeOut();
});
