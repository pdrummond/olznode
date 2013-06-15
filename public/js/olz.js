OlzApp = (function(Backbone, $) {

    var Action = Backbone.Model.extend({
        defaults: function() {
            return {
                title: 'Untitled action',
                order: Actions.nextOrder(),
                done: false
            };
        }
    });

    var ActionList = Backbone.Collection.extend({
        model: Action,
        localStorage: new Backbone.LocalStorage('openloopz2'),
        done: function() {
            return this.where({done: true});
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
        },
        initialize: function() {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function() {
            var template = this.template || (this.template = _.template($('#action-template').html())); //cache template on first pass.
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass('done', this.model.get('done'));
            this.input = this.$('.edit');
            return this;
        }
    });


    var AppView = Backbone.View.extend({
        el: $('#olzapp'),
            
        events: {
            'keypress #new-action': 'createOnEnter'
        },
        
        initialize: function() {
            this.input = this.$('#new-action');
            
            this.actions = Actions;
            
            this.listenTo(Actions, 'add', this.addOne);
            
            
            Actions.fetch();
        },
        
        render: function() {
            this.main.show();
            
        },
        
        addOne: function(action) {
            var view = new ActionView({model: action});
            this.$('#action-list').append(view.render().el);
        },
        
        createOnEnter: function(e) {
            if(e.keyCode != 13) return;
            if(!this.input.val()) return;
            
            Actions.create({title: this.input.val()});
            this.input.val('');
        }
       
    });
    
    return {
        init: function() {
            window.appView = new AppView();                
        }
    };


})(Backbone, $);

$(function() {
   OlzApp.init(); 
});