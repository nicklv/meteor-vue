// Object to be exported
Vue = this.Vue;

var p = Vue.prototype;

p.__callHook = p._callHook;
p._callHook = function (hook) {
    if(hook == 'created') {
        var self = this;

        // On every object use the $sync function to get the value
        _.each(this.$options.sync, function (rxFunc, key) {
            self.$sync(key, rxFunc);
        });
    }
    this.__callHook(hook);
}

/**
 * "Overwrite" of the Vue _init function
 * @param Array option Vue options
 */
p.__init = p._init;
p._init = function (option) {
    // Dict
    this.$$syncDict = {};

    // Init data field to avoid warning
    option = option || {};
    option.data = option.data || {};
    option.sync = option.sync || {};

    var sync = _.extend({}, this.constructor.options.sync || {}, option.sync);
    _.extend(option.data, sync);

    // Default init
    this.__init(option);
};

// Stop the key from syncDict
p.$unsync = function (key) {
    var ref = this.$$syncDict[key];

    if (ref && typeof ref.stop === 'function') {
        ref.stop();
    }
};

// Sync key in syncDict with value = rxFunc
p.$sync = function (key, rxFunc) {
    this.$unsync(key);

    if (typeof rxFunc === 'function') {
        var self = this;

        this.$$syncDict[key] = Tracker.autorun(function () {
            var val;
            val = rxFunc.call(self);
            if (val && typeof val.fetch === 'function') {
                return self.$set(key, val.fetch());
            } else {
                return self.$set(key, val);
            }
        });
    }
};

Vue.config.optionMergeStrategies.sync = Vue.config.optionMergeStrategies.computed

Vue.config.delimiters = ['[[', ']]'];
