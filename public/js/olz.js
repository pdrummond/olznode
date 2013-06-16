


OlzApp = (function(Backbone, $) {
    var config = {
        filter: ''
    };

    var Action = Backbone.Model.extend({
        defaults: function() {
            return {
                title: 'Untitled action',
                order: Actions.nextOrder(),
                done: false
            };
        },
        
        toggle: function() {
            this.save({done: !this.get('done')});
        }
    });

    var ActionList = Backbone.Collection.extend({
        model: Action,
        localStorage: new Backbone.LocalStorage('openloopz2'),
        done: function() {
            return this.where({done: true});
        },

        remaining: function() {
            return this.without.apply(this, this.done());
        },

        nextOrder: function() {
            if(!this.length) return 1;
            return this.last().get('order') + 1;
        },

        comparator: 'order'

    });

    var Actions = new ActionList;

    var ActionView = Backbone.View.extend({
        tagName: 'li',
        
        events: {
            'click .toggle'		: 'toggleDone',
            "dblclick .view"  : "edit",
            "click a.destroy" : "clear",
            "keypress .edit"  : "updateOnEnter",
            "blur .edit"      : "close"
        },
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
            this.listenTo(this.model, 'visible', this.toggleVisible);
        },

        render: function() {
            var template = this.template || (this.template = _.template($('#action-template').html())); 
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('done', this.model.get('done'));
            this.toggleVisible();
            this.input = this.$('.edit');
            return this;
        },

        toggleVisible: function() {
            this.$el.toggleClass('hidden', this.isHidden());
        },

        isHidden: function() {
	    var isCompleted = this.model.get('done');
	    var h = 
                (
		    (!isCompleted && config.filter === 'completed') ||
		        (isCompleted && config.filter === 'active')
	        );
            return h;
        },

        toggleDone: function() {
            this.model.toggle();
        },

        edit: function() {
            this.$el.addClass("editing");
            this.input.focus();
        },
        
        close: function() {
            var value = this.input.val();
            if (!value) {
                this.clear();
            } else {
                this.model.save({title: value});
                this.$el.removeClass("editing");
            }
        },
        
        updateOnEnter: function(e) {
            if (e.keyCode == 13) this.close();
        },
        
        clear: function() {
            this.model.destroy();
        }
    });


    var AppView = Backbone.View.extend({
        el: $('#olzapp'),
            
        events: {
            'keypress #new-action': 'createOnEnter',
            'click #clear-completed': 'clearCompleted',
            'click #toggle-all': 'toggleAllComplete'
        },
        
        initialize: function() {
            this.input = this.$('#new-action');
            this.allCheckbox = this.$('#toggle-all')[0];
            
            this.actions = Actions;
            
            this.listenTo(Actions, 'add', this.addOne);
            this.listenTo(Actions, 'reset', this.addAll);
            this.listenTo(Actions, 'change:completed', this.filterOne);
            this.listenTo(Actions, 'filter', this.filterAll);
            this.listenTo(Actions, 'all', this.render);

            this.footer = this.$('footer');
            this.main = $('#main');
            
            Actions.fetch();
        },
        
        render: function() {
            var done = Actions.done().length;
            var remaining = Actions.remaining().length;
            
            if (Actions.length) {
                var statsTemplate = this.statsTemplate || (this.statsTemplate = _.template($('#stats-template').html())); 

                this.main.show();
                this.footer.show();
                this.footer.html(statsTemplate({done: done, remaining: remaining}));

		this.$('#filters li a')
		    .removeClass('selected')
		    .filter('[href="#/' + (config.filter || '') + '"]')
		    .addClass('selected');
            } else {
                this.main.hide();
                this.footer.hide();
            }
            
            this.allCheckbox.checked = !remaining;
        },
        
        addOne: function(action) {
            var view = new ActionView({model: action});
            this.$('#action-list').append(view.render().el);
        },

        addAll: function() {
            Actions.each(this.addOne, this);
        },

	filterOne: function (action) {
	    action.trigger('visible');
	},
        
	filterAll: function () {
	    Actions.each(this.filterOne, this);
	},

        
        createOnEnter: function(e) {
            if(e.keyCode != 13) return;
            if(!this.input.val()) return;
            
            Actions.create({title: this.input.val()});
            this.input.val('');
        },

        clearCompleted: function() {
            _.invoke(Actions.done(), 'destroy');
            return false;
        },
        
        toggleAllComplete: function () {
            var done = this.allCheckbox.checked;
            Actions.each(function (action) { action.save({'done': done}); });
        }
        
    });

    
    var Router = Backbone.Router.extend({
	routes: {
	    '*filter': 'setFilter'
	},
        
	setFilter: function (param) {
	    // Set the current filter to be used
	    config.filter = param || '';
            
	    // Trigger a collection filter event, causing hiding/unhiding
	    // of Action view items
	    Actions.trigger('filter');
	}
    });
    
    router = new Router();
    Backbone.history.start();
    
    return {
        init: function() {
            window.appView = new AppView();                
        }
    };


})(Backbone, $);

$(function() {
   OlzApp.init(); 
});