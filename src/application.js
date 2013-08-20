/*
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
 * Author: Meg Ford <megford@gnome.org>
 *
 */
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const Gst = imports.gi.Gst;
const Signals = imports.signals;

const AudioProfile = imports.audioProfile;
const FileUtil = imports.fileUtil;
const Info = imports.info;
const Listview = imports.listview;
const Play = imports.play;
const Record = imports.record;
const Waveform = imports.waveform;

let audioProfile = null;
let fileManager = null; // do I use this?
let fileUtil = null;
let groupGrid;
let list = null;
let offsetController = null;
let path = null;
let play = null;
let view = null;
let wave = null;

const ActivePage = {
    RECORD: 'recorderPage',
    PLAY: 'playerPage',
    LISTVIEW: 'listviewPage'
};

const ListColumns = {
    NAME: 0,
    MENU: 1
};

const PipelineStates = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
}; 

const _TIME_DIVISOR = 60;
const _SEC_TIMEOUT = 100;
const _MILSEC_TIMEOUT = 1;

const Application = new Lang.Class({
    Name: 'Application',
    Extends: Gtk.ApplicationWindow,

     _init: function(params) {
        audioProfile = new AudioProfile.AudioProfile();
        this._buildFileName = new Record.BuildFileName()
        path = this._buildFileName.buildPath();
        this._buildFileName.ensureDirectory(path);
        offsetController = new FileUtil.OffsetController;
        fileUtil = new FileUtil.FileUtil();
        view = new MainView();
        play = new Play.Play();
        
        params = Params.fill(params, { title: GLib.get_application_name(),
                                       default_width: 700,
                                       default_height: 480,
                                       border_width: 12 });
        this.parent(params);
        
        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  halign: Gtk.Align.CENTER });
        let stackSwitcher = Gtk.StackSwitcher.new();
        stackSwitcher.set_stack(view);
        let header = new Gtk.HeaderBar({ hexpand: true });
        header.custom_title = stackSwitcher;
        
        grid.attach(header, 0, 0, 2, 2);

        grid.add(view);
            
        this._defineThemes();
                
        this.add(grid);
        grid.show_all();
    },
       
    _defineThemes : function() {
        let settings = Gtk.Settings.get_default();
        //settings.gtk_application_prefer_dark_theme = true;
    }
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gtk.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true,
                                       transition_type: Gtk.StackTransitionType.CROSSFADE,
                                       transition_duration: 100,
                                       visible: true });
        this.parent(params);

        let recorderPage = this._addRecorderPage('recorderPage');
            this.visible_child_name = 'listviewPage';
            //this.
            
        let listviewPage = this._addListviewPage('listviewPage');
             this.visible_child_name = 'playerPage';
                
        let playerPage = this._addPlayerPage('playerPage');
            this.visible_child_name = 'recorderPage';
            
        this.labelID = null;
    },
    
    _addListviewPage: function(name) {
        list = new Listview.Listview();
        list.enumerateDirectory();
        let initialPage = new Gtk.EventBox();
        
        groupGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                   halign: Gtk.Align.CENTER,
                                   valign: Gtk.Align.CENTER,
                                   row_spacing: 12,
                                   column_homogeneous: true }); 
        groupGrid.add(initialPage);
        this.add_titled(groupGrid, name, "View");             
    },

    _addRecorderPage: function(name) {
        this._record = new Record.Record(audioProfile);
        this.recordBox = new Gtk.EventBox();
        let recordGrid = new Gtk.Grid({ orientation: Gtk.Orientation.HORIZONTAL,
                                        halign: Gtk.Align.CENTER,
                                        valign: Gtk.Align.CENTER,
                                        column_homogeneous: true,
                                        column_spacing: 15 });
        this.recordBox.add(recordGrid);        

        let toolbarStart = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, 
                                         spacing: 0 });
        toolbarStart.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        recordGrid.attach(toolbarStart, 20, 0, 2, 1);
                
        this._comboBoxText = new EncoderComboBox();
        recordGrid.attach(this._comboBoxText, 20, 1, 3, 1);
        
        this.recordTimeLabel =  new Gtk.Label();
        recordGrid.attach(this.recordTimeLabel, 20, 2, 3, 1);
        
        this.recordVolume = new Gtk.VolumeButton();
        this.recordRange = Gtk.Adjustment.new(0.2, 0, 3.375, 0.05, 0.0, 0.0);
        this.recordVolume.set_adjustment(this.recordRange);
        this.recordVolume.connect ("value-changed", Lang.bind(this, this.setVolume));
        recordGrid.attach(this.recordVolume, 20, 4, 3, 1); 
        
        let recordButton = new RecordButton(this._record);       
        toolbarStart.pack_end(recordButton, false, true, 0);        
                
        let stopRecord = new Gtk.Button();
        this.stopRecImage = Gtk.Image.new_from_icon_name("media-playback-stop-symbolic", Gtk.IconSize.BUTTON);
        stopRecord.set_image(this.stopRecImage);
        stopRecord.connect("clicked", Lang.bind(this, this.onRecordStopClicked));
        toolbarStart.pack_end(stopRecord, true, true, 0);

        this.add_titled(this.recordBox, name, "Record");
    },
    
    _addPlayerPage: function(name) {
        this.playBox = new Gtk.EventBox();
        let playGrid = new Gtk.Grid({ orientation: Gtk.Orientation.HORIZONTAL,
                                      halign: Gtk.Align.CENTER,
                                      valign: Gtk.Align.CENTER,
                                      column_homogeneous: true,
                                      column_spacing: 15 });
        this.playBox.add(playGrid);      

        let playToolbar = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, 
                                        spacing: 0 });
        playToolbar.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        playGrid.attach(playToolbar, 20, 0, 2, 1);
        
        let loadButton = new LoadMoreButton(playGrid); 
        
        this.playTimeLabel =  new Gtk.Label();
        this.playTimeLabel.label = "0:00";
        playGrid.attach(this.playTimeLabel, 20, 1, 3, 1);
        
        this.playDurationLabel =  new Gtk.Label();
        this.playDurationLabel.label = "0:00";
        playGrid.attach(this.playDurationLabel, 20, 2, 3, 1);
        
        this.progressScale = new Gtk.Scale();
        this.progressScale.sensitive = false;
        
        this.progressScale.connect("button-press-event", Lang.bind(this,
            function() { 
                Application.play.onProgressScaleConnect(); 
                             
                return false;
            }));
            
        this.progressScale.connect("button-release-event", Lang.bind(this,
            function() {
                this.setProgressScaleInsensitive(); 
                this.onProgressScaleChangeValue();
                this._updatePositionCallback();
                
                return false;
            }));
              
        playGrid.attach(this.progressScale, 20, 3, 3, 1);
        
        this.playVolume = new Gtk.VolumeButton();
        this.range = Gtk.Adjustment.new(0.5, 0, 3.375, 0.15, 0.0, 0.0);
        this.playVolume.set_adjustment(this.range);
        this.playVolume.connect("value-changed", Lang.bind(this, this.setVolume));
        playGrid.attach(this.playVolume, 20, 4, 3, 1); 
              
        //this.playButton = new PlayPauseButton();
        //playToolbar.pack_end(this.playButton, false, true, 0);        
        
        let stopPlay = new Gtk.Button();
        this.stopImage = Gtk.Image.new_from_icon_name("media-playback-stop-symbolic", Gtk.IconSize.BUTTON);
        stopPlay.set_image(this.stopImage);
        stopPlay.connect("clicked", Lang.bind(this, this.onPlayStopClicked));
        playToolbar.pack_end(stopPlay, true, true, 0);

        this.add_titled(this.playBox, name, "Play");
    },
    
    onPlayStopClicked: function() {
        this.playButton.set_active(false);
        play.stopPlaying();       
    },
    
    onRecordStopClicked: function() {
        this._record.stopRecording();
    },
    
    setVisibleID: function() {
        let activePage = this.get_visible_child_name();
        return activePage;
    },
    
    setLabel: function(time, duration) {
        this.time = time
        this.duration = duration; 
        this.playPipeState = play.getPipeStates();
        
        if (this.playPipeState != PipelineStates.STOPPED) { //test this
            if (this.playDurationLabel.label == "0:00" && duration != 0) 
            this.durationString = this._formatTime(duration);
        } else {
            this.durationString = this._formatTime(duration);
        } 
        
        this.timeLabelString = this._formatTime(time);       
        
        
        if (this.setVisibleID() == ActivePage.RECORD ) {
            this.recordTimeLabel.label = this.timeLabelString;
        } else if (this.setVisibleID() == ActivePage.PLAY) {
            this.playTimeLabel.label = this.timeLabelString;
            
            if (this.playDurationLabel.label == "0:00" || this.playPipeState == PipelineStates.STOPPED) {
                this.playDurationLabel.label = this.durationString;
                this.setProgressScaleSensitive();
                this.progressScale.set_range(0.0, duration); 
            }                  
            this.progressScale.set_value(this.time);  
        }
    },
    
    setProgressScaleSensitive: function() {
        this.progressScale.sensitive = true;
    },
    
    setProgressScaleInsensitive: function() {
        this.progressScale.sensitive = false;
    },
    
    onProgressScaleChangeValue: function() {
        let seconds = Math.ceil(this.progressScale.get_value());
                
        Application.play.progressScaleValueChanged(seconds);
        
        return true;
    },
     
    _formatTime: function(unformattedTime) {
        this.unformattedTime = unformattedTime;
        let seconds = Math.floor(this.unformattedTime);
        let minuteString = parseInt( seconds / _TIME_DIVISOR ) % _TIME_DIVISOR;
        let secondString = seconds % _TIME_DIVISOR;
        let timeString = minuteString + ":" + (secondString  < 10 ? "0" + secondString : secondString);
        
        return timeString;
    },

    _updatePositionCallback: function() {
        let position = Application.play.queryPosition();
        log(position);
        log("position");
        
        if (position >= 0) {
            this.progressScale.set_value(position);
        }
        return true;
    },
    
    setVolume: function() { 
        let volumeValue;
        if (this.setVisibleID() == ActivePage.PLAY) {
            volumeValue = this.playVolume.get_value();
            Application.play.setVolume(volumeValue);
        } else if (this.setVisibleID() == ActivePage.RECORD) {
            volumeValue = this.recordVolume.get_value();
            this._record.setVolume(volumeValue);
        } 
    },
    
    getVolume: function() {
        let volumeValue = this.playVolume.get_value();
        
        return volumeValue;
    },
    
    listBoxAdd: function() {
        this.groupGrid = groupGrid;
        this._scrolledWin = new Gtk.ScrolledWindow({ shadow_type: Gtk.ShadowType.IN,
                                                     margin_bottom: 3,
                                                     margin_top: 5,
                                                     hexpand: false,
                                                     vexpand: false,
                                                     width_request: 800,
                                                     height_request: 400 });
        this._scrolledWin.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        this._scrolledWin.get_style_context().add_class('view');
        this.groupGrid.add(this._scrolledWin);
        this._scrolledWin.show();
        
        this.listBox = Gtk.ListBox.new();
        this._scrolledWin.add(this.listBox);
        this.listBox.set_selection_mode(Gtk.SelectionMode.SINGLE);
        this.listBox.set_header_func(null);
        this.listBox.set_activate_on_single_click(true);
        this.listBox.connect("row-selected", Lang.bind(this, 
            function(){
                this.rowGridCallback(this.listBox.get_selected_row())
            }));
        this.listBox.show();
        
        this._startIdx = offsetController.getOffset();
        log(this._startIdx);
        log("start");
        this._endIdx = offsetController.getcidx();
        log(this._endIdx);
        this._files = [];
        this._files = list.getFilesInfoForList();
        
        for (let i = this._startIdx; i <= this._endIdx; i++) {
            this.rowGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                          height_request: 36,
                                          width_request: 400,
                                          name: i.toString() });
            this.rowGrid.set_orientation(Gtk.Orientation.HORIZONTAL);
            this.listBox.add(this.rowGrid);
            this.rowGrid.show();
            
            this.widget = new Gtk.Toolbar({ show_arrow: false,
                                            halign: Gtk.Align.END,
                                            valign: Gtk.Align.FILL,
                                            icon_size: Gtk.IconSize.BUTTON,
                                            opacity: 1,
                                            name: "PlayToolBar" });
            this.rowGrid.attach(this.widget, 1, 0, 1, 1);
                       
            this._box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._group = new Gtk.ToolItem({ child: this._box });
            this.widget.insert(this._group, -1);
            
            // play button
            this._playListButton = new PlayPauseButton({ hexpand: false });     
            this._box.add(this._playListButton);
            this._playListButton.show();
            this._playListButton.connect('clicked', Lang.bind(this, 
                function(){
                    let row = this.listBox.get_selected_row();
                    play.passSelected(row); // this can be done with the uri. 
                    let gridForName = row.get_child();
                    let idx = parseInt(gridForName.name);
                    log(idx);
                    
                    let file =  this._files[idx];
                    log(file.uri);
                    log("PLAYURI");
                
                    this._playListButton._onPlayPauseToggled(row, file);             
                }));           
            
            this._fileName = new Gtk.Label({ use_markup: true, 
                                             halign: Gtk.Align.START,
                                             ellipsize: true,
                                             xalign: 0,
                                             width_chars: 40,
                                             margin_top: 5,
                                             margin_left: 15 });
                                           log(this._files[i].fileName);
            let markup = ('<b>'+ this._files[i].fileName + '</b>');
            this._fileName.label = markup;
            this._fileName.set_no_show_all(true);
            this.rowGrid.add(this._fileName);
            this._fileName.show();
            
            this.waveFormGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                               height_request: 36,
                                               width_request: 200,
                                               name: "WaveFormGrid" });
            this.waveFormGrid.set_no_show_all(true);
            this.rowGrid.add(this.waveFormGrid);

            this.waveFormGrid.show();

            this.widgetInfo = new Gtk.Toolbar({ show_arrow: false,
                                                halign: Gtk.Align.END,
                                                valign: Gtk.Align.FILL,
                                                icon_size: Gtk.IconSize.BUTTON,
                                                opacity: 1 });
            this.rowGrid.attach(this.widgetInfo, 3, 0, 1, 1);
            
            this._boxInfo = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._groupInfo = new Gtk.ToolItem({ child: this._boxInfo });
            this.widgetInfo.insert(this._groupInfo, -1);
            
            // info button
            this._info = new Gtk.Button({ hexpand: false });
            this._info.image = Gtk.Image.new_from_icon_name("dialog-information-symbolic", Gtk.IconSize.BUTTON);
            this._info.connect("clicked", Lang.bind(this, 
                function() {
                    let row = this.listBox.get_selected_row();
                    let gridForName = row.get_child();
                    let idx = parseInt(gridForName.name);
                    log(idx);
                    
                    let file =  this._files[idx];
                    log(file.fileName);
                    this._onInfoButton(file);
                })); 
            this._info.set_tooltip_text(_("Info"));         
            this._boxInfo.add(this._info);
            this._info.show();
            
            this.widgetShare = new Gtk.Toolbar({ show_arrow: false,
                                                 halign: Gtk.Align.END,
                                                 valign: Gtk.Align.FILL,
                                                 icon_size: Gtk.IconSize.BUTTON,
                                                 opacity: 1 });
            this.rowGrid.attach(this.widgetShare, 4, 0, 1, 1);
            
            this._boxShare = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._groupShare = new Gtk.ToolItem({ child: this._boxShare });
            this.widgetShare.insert(this._groupShare, -1);
            
            // sharing button
            this._share = new Gtk.Button({ hexpand: false });
            this._share.image = Gtk.Image.new_from_icon_name("send-to-symbolic", Gtk.IconSize.BUTTON);
            this._share.set_tooltip_text(_("Share"));
            this._boxShare.add(this._share);
            this._share.show();
            
            this.widgetDelete = new Gtk.Toolbar({ show_arrow: false,
                                                  halign: Gtk.Align.END,
                                                  valign: Gtk.Align.FILL,
                                                  icon_size: Gtk.IconSize.BUTTON,
                                                  opacity: 1 });
            this.widgetDelete.get_style_context().add_class('toolbarEnd');                                       
            this.rowGrid.attach(this.widgetDelete, 5, 0, 1, 1);
            
            this._boxDelete = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._groupDelete = new Gtk.ToolItem({ child: this._boxDelete });
            this.widgetDelete.insert(this._groupDelete, -1);

            // delete button
            this._delete = new Gtk.Button({ hexpand: false });
            this._delete.image = Gtk.Image.new_from_icon_name("user-trash-symbolic", Gtk.IconSize.BUTTON);
            this._delete.connect("clicked", Lang.bind(this, 
                function() {
                    this._deleteFile(this.listBox.get_selected_row());
                }));
            this._delete.set_tooltip_text(_("Delete"));
            this._boxDelete.add(this._delete);
            this._boxDelete.show();                      
            
            this._separator = Gtk.Separator.new(Gtk.Orientation.HORIZONTAL);
            this._separator.set_sensitive(false);
            this.listBox.add(this._separator);
            this.selectionRow = this._separator.get_parent();
            this.selectionRow.set_sensitive(false);
            this._separator.show();                       
        } 
    },
    
    rowGridCallback: function(selectedRow) {
        if (selectedRow) {
        
           if (this._selectedRow) {
              let rowWidget = this._selectedRow.get_child(this.widget);
              rowWidget.foreach(Lang.bind(this, 
                function(child) {
                    let alwaysShow = child.get_no_show_all();
                    
                    if (!alwaysShow)
                        child.hide();
                }));
            }
                              
            this._selectedRow = selectedRow;
            let selectedRowWidget = this._selectedRow.get_child(this.widget);
            selectedRowWidget.show_all();
            selectedRowWidget.foreach(Lang.bind(this, 
                function(child) {
                    let alwaysShow = child.get_no_show_all();
                    
                    if (!alwaysShow)
                        child.sensitive = true;
                }));
        }                        
    },
    
    _getFileNameFromRow: function(selected) {
        this._selected = selected;
        let fileForAction = null;
        let rowWidget = this._selected.get_child(this.fileName);
        rowWidget.foreach(Lang.bind(this, 
            function(child) {
                let alwaysShow = child.get_no_show_all();
                
                if (alwaysShow) {
                    let name = child.get_text();
                    fileForAction = fileUtil.loadFile(name);
                }
             }));
             
        return fileForAction;
    },
    
    _deleteFile: function(selected) {
        this._selected = selected;
        let fileToDelete = this._getFileNameFromRow(this._selected);
        fileUtil.deleteFile(fileToDelete);      
    },
    
    loadPlay: function(selected) {
        this._selected = selected;
        let fileToPlay = this._getFileNameFromRow(this._selected);
        
        return fileToPlay;
    }, //why is this here? I can just use getFileNameFromRow, can't I?
    
    _onInfoButton: function(selected) {
        this._selected = selected;
        //let fileForInfo = this._getFileNameFromRow(this._selected);
        let infoDialog = new Info.InfoDialog(selected);

        infoDialog.widget.connect('response', Lang.bind(this,
            function(widget, response) {
                infoDialog.widget.destroy();
            }));
    }
});

const RecordButton = new Lang.Class({
    Name: "RecordButton",
    Extends: Gtk.Button,
    
    _init: function(record, activeProfile) {
        this._record = record;
        this._activeProfile = activeProfile;
        this.recordImage = Gtk.Image.new_from_icon_name("media-record-symbolic", Gtk.IconSize.BUTTON);
        this.pauseImage = Gtk.Image.new_from_icon_name("media-playback-pause-symbolic", Gtk.IconSize.BUTTON);              
        this.parent();
        this.set_image(this.recordImage);
        this.connect("clicked", Lang.bind(this, this._onRecord));
    },
    
    _onRecord: function() {
        this._record.startRecording(); 
    }
});

const PlayPauseButton = new Lang.Class({
    Name: "PlayPauseButton",
    Extends: Gtk.ToggleButton,
    
    _init: function() {
        this.playImage = Gtk.Image.new_from_icon_name("media-playback-start-symbolic", Gtk.IconSize.BUTTON);
        this.pauseImage = Gtk.Image.new_from_icon_name("media-playback-pause-symbolic", Gtk.IconSize.BUTTON);              
        this.parent();
        this.set_image(this.playImage);
    },
    
    _onPlayPauseToggled: function(listRow, selFile) {
        let activeState = play.getPipeStates();

        if (activeState != PipelineStates.PLAYING) {
            play.startPlaying();
            let rowWidget = listRow.get_child(this.widget);
            rowWidget.foreach(Lang.bind(this, 
                function(child) {
                    let alwaysShow = child.get_no_show_all();
                    
                    if (!alwaysShow)
                        child.hide();
                    log(child); 
                                   
                    if (child.name == "PlayToolBar") {
                        this.set = true;
                        child.show();

                    } 
                    
                    if (child.name == "WaveFormGrid") 
                        this.wFGrid = child;                                              
                })); 
             log(activeState);
             log("activeState");
            if (activeState == PipelineStates.PAUSED)
                wave.timer();
            else      
                wave = new Waveform.WaveForm(selFile, this.wFGrid);
        } else if (activeState == PipelineStates.PLAYING) {
            this.set_image(this.pauseImage);
            //this.set_tooltip_text(_("Play"));
            play.pausePlaying();
            log("PAUSED");
            wave.pauseDrawing();
            log(activeState);
             log("activeState");          
        }  
    }    
});

const EncoderComboBox = new Lang.Class({ 
    Name: "EncoderComboBox",
    Extends: Gtk.ComboBoxText, 
       
    // encoding setting labels in combobox
    _init: function() {
        this.parent();
        let combo = [_("Ogg Vorbis"), _("Ogg Opus"),  _("Flac"), _("Mp3"), _("AAC")];
        
        for (let i = 0; i < combo.length; i++)
            this.append_text(combo[i]);

        this.set_sensitive(true);
        this.connect("changed", Lang.bind(this, this._onComboBoxTextChanged)); 
    },
   
    _onComboBoxTextChanged: function() {        
        let activeProfile = this.get_active();
        audioProfile.assignProfile(activeProfile);
    }        
}); 

const LoadMoreButton = new Lang.Class({
    Name: 'LoadMoreButton',

    _init: function(playgr) {
        this._block = false;

        this._controller = offsetController;

        // Translators: "more" refers to recordings in this context
        this._label = new Gtk.Label({ label: _("Load More"),
                                      visible: true });
        playgr.add(this._label);

        this.widget = new Gtk.Button();
                                       
        this.widget.get_style_context().add_class('documents-load-more');
        playgr.add(this.widget);
        
        this.widget.connect('clicked', Lang.bind(this,
            function() {
                this._label.label = _("Loading…");

                this._controller.increaseOffset();
                list._setDiscover();
            }));
    }
}); 

            
    
