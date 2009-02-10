// Init
load("src/env.js");

window.location = "test/index.html";

window.onload = function(){
    // Load the test runner
    load("test/testrunner.js", "test/jquery.js");

    // for testing .noConflict()
    this.jQuery || "jQuery";
    this.$ = this.$ || "$";
    this.originaljQuery = jQuery;
    this.original$ = $;
    
    // Load the tests
    load(
        "test/unit/core.js",
        "test/unit/selector.js",
        "test/unit/event.js",
        "test/unit/data.js"//,
        //"test/unit/fx.js",
        //"test/unit/ajax.js",
        //"test/unit/dimensions.js",
        //"test/unit/offset.js"
    );
    
    // Display the results
    results();
};
