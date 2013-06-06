/*
 *  Author: Meg Ford <megford@gnome.org>
 *
 * Copyright 2013 Meg Ford
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this library; if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 *
 *
 */
 
imports.gi.versions.Gst = '1.0';

const Gst = imports.gi.Gst;

const Play = imports.play;
const Record = imports.record;

const ButtonID = {
    RECORD_BUTTON: 0,
    PLAY_BUTTON: 1
};

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.ApplicationWindow,

    _init: function(params) {
        params = Params.fill(params, { title: GLib.get_application_name(),
                                       default_width: 640,
                                       default_height: 480 });
        this.parent(params);

        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  halign: Gtk.Align.CENTER });
        let header = new Gd.HeaderBar({ title: _(""),
                                        hexpand: true });

        this._recordPageButton = new Gtk.Button({ label: _("Recorder"),
                                                  hexpand: true });
        header.pack_start(this._recordPageButton);
        this._playPageButton = new Gtk.Button({ label: _("Player"),
                                                hexpand: true });
        header.pack_start(this._playPageButton);
        
        grid.attach(header, 0, 0, 2, 2);

        this._view = new MainView();
        this._view.visible_child_name = (Math.random() <= 0.5) ? 'recorderPage' : 'playerPage';
        grid.add(this._view);
        this._recordPageButton.connect('clicked', Lang.bind(this, 
            function() {
                this._view.visible_child_name = 'recorderPage'; 
            }));
        this._playPageButton.connect('clicked', Lang.bind(this, 
            function(){
                this._view.visible_child_name = 'playerPage'; 
            }));
            
        this._defineThemes();

        this.add(grid);
        grid.show_all();
    },
       
    _defineThemes : function() {
        let settings = Gtk.Settings.get_default();
        settings.gtk_application_prefer_dark_theme = true;
    }
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gd.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true });
        this.parent(params);

        let recorderPage = this._addRecorderPage('recorderPage');
            this.visible_child_name = 'playerPage';
            
        let playerPage = this._addPlayerPage('playerPage');
            this.visible_child_name = 'recorderPage';
    },

    _addPage: function(name) {
        let initialPage = Gtk.Image.new_from_icon_name("audio-input-microphone-symbolic", Gtk.IconSize.DIALOG);

        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  halign: Gtk.Align.CENTER,
                                  valign: Gtk.Align.CENTER,
                                  column_homogeneous: true });            
        grid.add(initialPage);
        this.add_named(grid, name);
    },

    _addRecorderPage: function(name) {
        this._record = new Record.record();
        this.recordBox = new Gtk.EventBox();
        let recordGrid = new Gtk.Grid({ orientation: Gtk.Orientation.HORIZONTAL,
                                        halign: Gtk.Align.CENTER,
                                        valign: Gtk.Align.CENTER,
                                        column_homogeneous: true,
                                        column_spacing: 15 });
        this.recordBox.add(recordGrid);        

        let toolbarStart = new Gtk.Box({ orientation : Gtk.Orientation.HORIZONTAL, spacing : 0 });
        toolbarStart.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        recordGrid.attach(toolbarStart, 20, 0, 2, 1);
        
        let recordButton = new RecordPauseButton(this._record);       
        toolbarStart.pack_end(recordButton, false, true, 0);
        
        let buttonID = ButtonID.RECORD_BUTTON;
                
        this.stop = new StopButton(this._record, recordButton, buttonID);
        toolbarStart.pack_end(this.stop, true, true, 0);

        this.add_named(this.recordBox, name);
    },
    
      _addPlayerPage: function(name) {
        this._play = new Play.play();
        this.playBox = new Gtk.EventBox();
        let playGrid = new Gtk.Grid({ orientation: Gtk.Orientation.HORIZONTAL,
                                      halign: Gtk.Align.CENTER,
                                      valign: Gtk.Align.CENTER,
                                      column_homogeneous: true,
                                      column_spacing: 15 });
        this.playBox.add(playGrid);        

        let playToolbar = new Gtk.Box({ orientation : Gtk.Orientation.HORIZONTAL, spacing : 0 });
        playToolbar.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        playGrid.attach(playToolbar, 20, 0, 2, 1);        
               
        let playButton = new Gtk.Button();
        playButton.set_image(Gtk.Image.new_from_icon_name("media-playback-start-symbolic", Gtk.IconSize.BUTTON));
        playToolbar.pack_end(playButton, false, true, 0);
        
        let buttonID = ButtonID.PLAY_BUTTON;
        
        this.stopPlay = new StopButton(this._play, playButton, buttonID);
        playToolbar.pack_end(this.stopPlay, true, true, 0);

        this.add_named(this.playBox, name);
    },

});

const RecordPauseButton = new Lang.Class({
    Name: "RecordPauseButton",
    Extends: Gtk.ToggleButton,
    
    _init: function(record) {
        this._record = record;
        this.recordImage = Gtk.Image.new_from_icon_name("media-record-symbolic", Gtk.IconSize.BUTTON);
        this.pauseImage = Gtk.Image.new_from_icon_name("media-playback-pause-symbolic", Gtk.IconSize.BUTTON);              
        this.parent();
        this.set_image(this.recordImage);
        this.connect("clicked", Lang.bind(this, this._onRecordPauseToggled));
    },
    
    _onRecordPauseToggled: function() {
        if (this.get_active()) {
            this.set_image(this.pauseImage);
            this._record._recordPipeline();//startRecording(); 
        } else {
            this.set_image(this.recordImage);
            this._record.pauseRecording();            
        }
    },
});

const StopButton = new Lang.Class({
    Name: "StopButton",
    Extends: Gtk.Button,
       
    _init: function(action, activeButton, id) {
        this._action = action;
        this._id = id;
        this._activeButton = activeButton;
        this.stopImage = Gtk.Image.new_from_icon_name("media-playback-stop-symbolic", Gtk.IconSize.BUTTON);
        this.parent();
        this.set_image(this.stopImage);
        this.connect("clicked", Lang.bind(this, this._onStopClicked));
    }, 
            
    _onStopClicked: function() {
        this._activeButton.set_active(false);
        if (this._id == ButtonID.RECORD_BUTTON) {
            this._action.stopRecording();
        } else if (ButtonID.PLAY_BUTTON) {
            this.player.stopPlaying(); 
        }
    } 
});        
    
