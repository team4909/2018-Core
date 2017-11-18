var template;

// Handlebars Helpers

// http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if( lvalue!=rvalue ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});

// http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
Handlebars.registerHelper('compare', function(lvalue, rvalue, options) {

    if (arguments.length < 3)
        throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

    var operator = options.hash.operator || "==";

    var operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    }

    if (!operators[operator])
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);

    var result = operators[operator](lvalue,rvalue);

    if( result ) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }

});

Handlebars.registerHelper('formtemplate', function(context) {
    return template(context);
});

// Make Form JSON Global
var form = {};

function configureForm(){
	window.plugins.simpleFile.external.read(config.receiveFolder + "form.json", function(data) {
		// Parse Form JSON
		form = JSON.parse(data);
		
		window.plugins.simpleFile.external.read(config.receiveFolder + "page-template.html", function(pageSource) {
            window.plugins.simpleFile.external.read(config.receiveFolder + "form-template.html", function(formSource) {

                // GENERATE TEMPLATE
                const pageTemplate = Handlebars.compile(pageSource);
                template = Handlebars.compile(formSource);
                const res = pageTemplate(form);

                // DISPLAY FORM
                $("#mainPage").html(res);

                $("." + form.views[0].id).show();

                // Click Handler for Submit Button
                $(".submit-button").click(function(event){
                    var match = {};

                    for(key in form.match_record){
                        inputType = form.match_record[key].split(":")[0];
                        inputId = form.match_record[key].split(":")[1];

                        switch(inputType){
                            case "text":
                                match[key] = $(inputId).val();
                                break;
                            case "number":
                                match[key] = Number($(inputId).val());
                                break;
                            case "checkbox":
                                match[key] = Number($(inputId)[0].checked);
                                break;
                            case "incr":
                                if($(inputId).val() > 0)
                                    match[key] = Number($(inputId).val());
                                else
                                    match[key] = 0;
                                break;
                        }
                    }

                    // Send data to Hub
                    dataTransfer.send(config, match);

                    // Reset and repopulate form
                    configureForm();
                });

            }, dataTransfer.handleError);
            
		}, dataTransfer.handleError);
		
	}, dataTransfer.handleError);
}