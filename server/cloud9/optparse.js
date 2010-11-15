var Parser = module.exports = function(options) {
    this.mapOptions = options;
};

(function() {

    this.usage = function() {
        var message = "USAGE: " + process.argv[1].split("/").pop(),
            hint, opt, def,
            mapOption;

        for(opt in this.mapOptions) {
            mapOption = this.mapOptions[opt];
            hint = mapOption.hint;
            def = mapOption.def;
            message += " [-" + opt + " " + hint.replace("{def}", def) + "]";
        }
        console.log(message);
        process.exit(0);
    }

    this.$getArg = function(argv, arg) {
        var optionMap = this.mapOptions[arg.replace("-", "")];
        var key = optionMap ? optionMap.key : null;
        var parser = optionMap ? optionMap.parser : null;

        if (optionMap && optionMap.type == "boolean")
            return {key: key, value: true};

        var option = argv.shift();

        if(!key || !option){
            this.usage();
            return null;
        }
        if(parser)
            option = parser(option);
        return { key: key, value: option};
    }

    this.parseArguments = function(argv) {
        var arg, key, opt, opts = {}, opts_def = {};
        while (argv.length && (arg = argv.shift())) {
            opt = this.$getArg(argv, arg);
            opts[opt.key] = opt.value;
        }
        //set default values
        for(key in this.mapOptions) {
            opt = this.mapOptions[key];
            opts_def[opt.key] = opt.def;
        }
        //merge config options
        for(key in opts_def) {
            if(!opts[key])
                opts[key] = (opts._config && opts._config[key])? opts._config[key] : opts_def[key] ;
        }
        delete opts._config;
        return opts;
    }

}).call(Parser.prototype);