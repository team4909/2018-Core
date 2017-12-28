$(function () {
    setTimeout(function () {
        const templates = {
            dashboard: Handlebars.compile($("#dashboard-template").html())
        };

        $(".main").html(templates.dashboard({}));

        $('.page-loader-wrapper').fadeOut();
    }, 50);
});
