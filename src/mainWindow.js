/*
* Copyright 2013 Meg Ford
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Library General Public
* License as published by the Free Software Foundation; either
* version 2 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
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
const Gdk = imports.gi.Gdk;
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
let selectable = null;
let view = null;
let wave = null;

const ActiveArea = {
    RECORD: 0,
    PLAY: 1
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

const MainWindow = new Lang.Class({
    Name: 'MainWindow',
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
        
        params = Params.fill(params, { title: GLib.get_application_name(), //change this
                                       default_width: 700,
                                       default_height: 480,
                                       border_width: 12 });
        this.parent(params);
        
        let grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  halign: Gtk.Align.CENTER });
        let stackSwitcher = Gtk.StackSwitcher.new();
        stackSwitcher.set_stack(view);
        let header = new Gtk.HeaderBar({ hexpand: true });
        header.set_show_close_button(true);
        this.set_titlebar(header);
        
        let recordToolbar = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL,
                                        spacing: 0 });
        recordToolbar.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);
        header.pack_start(recordToolbar);
        let recordButton = new RecordButton({ label: "Record",
                                              margin_bottom: 4,
                                              margin_top: 6,
                                              margin_left: 6,
                                              margin_right: 6 });
        recordToolbar.pack_end(recordButton, false, true, 0);
        recordToolbar.get_style_context().add_class('header');
        recordToolbar.show();
        recordButton.show();
        
        let preferencesButton = new Gtk.Button();
        let preferencesImage = Gtk.Image.new_from_icon_name("emblem-system-symbolic", Gtk.IconSize.BUTTON);
        preferencesButton.image = preferencesImage;
        //add code to choose codec
        
        header.pack_end(preferencesButton);

        grid.add(view);
            
        this._defineThemes();
                
        this.add(grid);
        grid.show_all();
        this.show_all();
    },
       
    _defineThemes : function() {
        //let settings = Gtk.Settings.get_default();
        //settings.gtk_application_prefer_dark_theme = true;
    }
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gtk.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: false,
                                       vexpand: false,
                                       transition_type: Gtk.StackTransitionType.CROSSFADE,
                                       transition_duration: 100,
                                       visible: true });
        this.parent(params);
            
        let listviewPage = this._addListviewPage('listviewPage');
             this.visible_child_name = 'playerPage';
        
        let recorderPage = this._addRecorderPage('recorderPage');
            this.visible_child_name = 'listviewPage';
                
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
        
                
        this._comboBoxText = new EncoderComboBox();
        //recordGrid.attach(this._comboBoxText, 20, 1, 3, 1);
        
       // this.recordTimeLabel = new Gtk.Label();
        //recordGrid.attach(this.recordTimeLabel, 20, 2, 3, 1);
        
        this.recordVolume = new Gtk.VolumeButton();
        this.recordRange = Gtk.Adjustment.new(0.2, 0, 3.375, 0.05, 0.0, 0.0);
        this.recordVolume.set_adjustment(this.recordRange);
        this.recordVolume.connect ("value-changed", Lang.bind(this, this.setVolume));
        //recordGrid.attach(this.recordVolume, 20, 4, 3, 1);
                

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
        
       
        
        this.progressScale = new Gtk.Scale();
        this.progressScale.sensitive = false;
        
        this.progressScale.connect("button-press-event", Lang.bind(this,
            function() {
                MainWindow.play.onProgressScaleConnect();
                             
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
        
        /*this.playVolume = new Gtk.VolumeButton();
        this.range = Gtk.Adjustment.new(0.5, 0, 3.375, 0.15, 0.0, 0.0);
        this.playVolume.set_adjustment(this.range);
        this.playVolume.connect("value-changed", Lang.bind(this, this.setVolume));
        playGrid.attach(this.playVolume, 20, 4, 3, 1);*/
              
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
        //this.playButton.set_active(false);
        play.stopPlaying();
    },
    
    onRecordStopClicked: function() {
        this._record.stopRecording();
        this.recordGrid.hide();
    },
    
    setProgressScaleSensitive: function() {
        this.progressScale.sensitive = true;
    },
    
    setProgressScaleInsensitive: function() {
        this.progressScale.sensitive = false;
    },
    
    onProgressScaleChangeValue: function() {
        let seconds = Math.ceil(this.progressScale.get_value());
                
        MainWindow.play.progressScaleValueChanged(seconds);
        
        return true;
    },
     
    _formatTime: function(unformattedTime) {
        this.unformattedTime = unformattedTime;
        let seconds = Math.floor(this.unformattedTime);
        let minuteString = parseInt( seconds / _TIME_DIVISOR ) % _TIME_DIVISOR;
        let secondString = seconds % _TIME_DIVISOR;
        let timeString = minuteString + ":" + (secondString < 10 ? "0" + secondString : secondString);
        
        return timeString;
    },

    _updatePositionCallback: function() {
        let position = MainWindow.play.queryPosition();
        log(position);
        log("position");
        
        if (position >= 0) {
            this.progressScale.set_value(position);
        }
        return true;
    },
    
    setVolume: function() {
        let volumeValue;
        if (this.setVisibleID == ActiveArea.PLAY) {
            volumeValue = this.playVolume.get_value();
            MainWindow.play.setVolume(volumeValue);
        } else if (this.setVisibleID == ActiveArea.RECORD) {
            volumeValue = this.recordVolume.get_value();
            this._record.setVolume(volumeValue);
        }
    },
    
    getVolume: function() {
        let volumeValue = this.playVolume.get_value();
        
        return volumeValue;
    },
    
    listBoxAdd: function() {
        selectable = true;
        this.groupGrid = groupGrid;
        
                
        this.recordGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                         height_request: 36,
                                         width_request: 400,
                                         name: "recordGrid" });
        this.recordGrid.set_orientation(Gtk.Orientation.HORIZONTAL);
        this.groupGrid.add(this.recordGrid);
        
        this.widgetRecord = new Gtk.Toolbar({ show_arrow: false,
                                              halign: Gtk.Align.END,
                                              valign: Gtk.Align.FILL,
                                              icon_size: Gtk.IconSize.BUTTON,
                                              opacity: 1 });
        this.widgetRecord.get_style_context().add_class('toolbarEnd');
        this.recordGrid.attach(this.widgetRecord, 0, 0, 2, 2);
            
        this._boxRecord = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        this._groupRecord = new Gtk.ToolItem({ child: this._boxRecord });
        this.widgetRecord.insert(this._groupRecord, -1);
        
        this.recordTextLabel = new Gtk.Label({ margin_bottom: 4,
                                               margin_top: 6,
                                               margin_left: 6,
                                               margin_right: 6 });
        this.recordTextLabel.label = "Recording...";
        this._boxRecord.pack_start(this.recordTextLabel, false, true, 0);
        
        this.recordTimeLabel = new Gtk.Label({ margin_bottom: 4,
                                               margin_top: 6,
                                               margin_left: 6,
                                               margin_right: 6 });
        
        this._boxRecord.pack_start(this.recordTimeLabel, false, true, 0);
        
        this.toolbarStart = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
        this.toolbarStart.get_style_context().add_class(Gtk.STYLE_CLASS_LINKED);

        // finish button (stop recording)
        let stopRecord = new Gtk.Button({ label: "Finish",
                                          margin_bottom: 4,
                                          margin_top: 6,
                                          margin_left: 6,
                                          margin_right: 6,
                                          hexpand: true,
                                          vexpand: true });
        stopRecord.connect("clicked", Lang.bind(this, this.onRecordStopClicked));
        this.toolbarStart.pack_start(stopRecord, true, true, 0);
        this.recordGrid.attach(this.toolbarStart, 5, 1, 1, 2);
            
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
            this.widget.get_style_context().add_class('toolbar');
            this.rowGrid.attach(this.widget, 1, 0, 1, 2);
                       
            this._box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._group = new Gtk.ToolItem({ child: this._box });
            this.widget.insert(this._group, -1);
            
            // play button
            let playImage = Gtk.Image.new_from_icon_name("media-playback-start-symbolic", Gtk.IconSize.BUTTON);
            let pauseImage = Gtk.Image.new_from_icon_name("media-playback-pause-symbolic", Gtk.IconSize.BUTTON);
            this._playListButton = new PlayPauseButton({ hexpand: false,
                                                         name: "PlayButton" });
            this._playListButton.set_image(playImage);
            this._box.pack_start(this._playListButton, false, true, 0);
            this._playListButton.show();
            this._playListButton.connect('clicked', Lang.bind(this,
                function(){
                    let row = this.listBox.get_selected_row();
                    play.passSelected(row); // this can be done with the uri.
                    let gridForName = row.get_child();
                    let idx = parseInt(gridForName.name);
                    
                    let file = this._files[idx];
                    this._playListButton._onPlayPauseToggled(row, file);
                }));
            
            this._fileName = new Gtk.Label({ use_markup: true,
                                             halign: Gtk.Align.START,
                                             ellipsize: true,
                                             xalign: 0,
                                             width_chars: 40,
                                             margin_top: 5,
                                             margin_left: 15,
                                             name: "FileNameLabel" });
            let markup = ('<b>'+ this._files[i].fileName + '</b>');
            this._fileName.label = markup;
            this._fileName.set_no_show_all(true);
            this.rowGrid.attach(this._fileName, 2, 0, 1, 3);
            this._fileName.show();
            
            this._playLabelBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL,
                                               name: "PlayLabelBox" });
            this.rowGrid.attach(this._playLabelBox, 2, 1, 1, 1);
            this._playLabelBox.show();
                    
            this.playDurationLabel = new Gtk.Label({ margin_left: 15,
                                                     halign: Gtk.Align.END,
                                                     name: "PlayDurationLabel" });
            this.fileDuration = this._formatTime(this._files[i].duration/Gst.SECOND);
            this.playDurationLabel.label = this.fileDuration;
            this._playLabelBox.pack_start(this.playDurationLabel, false, true, 0);
            this.playDurationLabel.show();
            
            this.dividerLabel = new Gtk.Label({ halign: Gtk.Align.START,
                                                 name: "DividerLabel" });
            this.dividerLabel.label = "/";
            this._playLabelBox.pack_start(this.dividerLabel, false, true, 0);
            this.dividerLabel.hide();
            
            this.playTimeLabel = new Gtk.Label({ halign: Gtk.Align.START,
                                                 name: "PlayTimeLabel" });
            this.playTimeLabel.label = "0:00";
            this._playLabelBox.pack_start(this.playTimeLabel, false, true, 0);
            this.playTimeLabel.hide();
            
            this.waveFormGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                               height_request: 36,
                                               width_request: 350,
                                               name: "WaveFormGrid" });
            this.waveFormGrid.set_no_show_all(true);
            this.rowGrid.add(this.waveFormGrid);

            this.waveFormGrid.show();

            this.widgetInfo = new Gtk.Toolbar({ show_arrow: false,
                                                halign: Gtk.Align.END,
                                                valign: Gtk.Align.FILL,
                                                icon_size: Gtk.IconSize.BUTTON,
                                                opacity: 1,
                                                name: "InfoToolbar" });
            this.rowGrid.attach(this.widgetInfo, 4, 0, 1, 2);
            this.widgetInfo.get_style_context().add_class('toolbar');
            
            this._boxInfo = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._groupInfo = new Gtk.ToolItem({ child: this._boxInfo });
            this.widgetInfo.insert(this._groupInfo, -1);
            
            // info button
            this._info = new Gtk.Button({ hexpand: false,
                                          name: "InfoButton" });
            this._info.image = Gtk.Image.new_from_icon_name("dialog-information-symbolic", Gtk.IconSize.BUTTON);
            this._info.connect("clicked", Lang.bind(this,
                function() {
                    let row = this.listBox.get_selected_row();
                    let gridForName = row.get_child();
                    let idx = parseInt(gridForName.name);
                    log(idx);
                    
                    let file = this._files[idx];
                    log(file.fileName);
                    this._onInfoButton(file);
                }));
            this._info.set_tooltip_text(_("Info"));
            this._boxInfo.add(this._info);
            this._info.hide();
            
            this.widgetDelete = new Gtk.Toolbar({ show_arrow: false,
                                                  halign: Gtk.Align.END,
                                                  valign: Gtk.Align.FILL,
                                                  icon_size: Gtk.IconSize.BUTTON,
                                                  opacity: 1,
                                                  name: "DeleteToolbar" });
            this.widgetDelete.get_style_context().add_class('toolbarEnd');
            this.rowGrid.attach(this.widgetDelete, 5, 0, 1, 2);
            
            this._boxDelete = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
            this._groupDelete = new Gtk.ToolItem({ child: this._boxDelete });
            this.widgetDelete.insert(this._groupDelete, -1);

            // delete button
            this._delete = new Gtk.Button({ hexpand: false,
                                            name: "DeleteButton" });
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
                this.activeState = play.getPipeStates();
                
                if (this.activeState == PipelineStates.PLAYING) {
                log("this.activeState == PipelineStates.PLAYING");
                    this._playListButton.set_active(false);
                    play.stopPlaying();
                }
            }
                              
            this._selectedRow = selectedRow;
            let selectedRowWidget = this._selectedRow.get_child(this.widget);
            selectedRowWidget.show_all();
            selectedRowWidget.foreach(Lang.bind(this,
                function(child) {
                    let alwaysShow = child.get_no_show_all();
                    
                    if (!alwaysShow)
                        child.sensitive = true;
                        
                    if (child.name == "WaveFormGrid")
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
                log(child.name);
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
    },   
        
    setLabel: function(time, duration) {
        this.time = time
        this.duration = duration;
        this.playPipeState = play.getPipeStates();
        
       /* if (this.playPipeState != PipelineStates.STOPPED) { //test this
            if (this.playDurationLabel.label == "0:00" && duration != 0)
            this.durationString = this._formatTime(duration);
        } else {
            this.durationString = this._formatTime(duration);
        }*/
        
        this.timeLabelString = this._formatTime(time);
        
        if (this.setVisibleID == ActiveArea.RECORD) {
            this.recordTimeLabel.label = this.timeLabelString;
            this.recordTimeLabel.get_style_context().add_class('dim-label');
        } else if (this.setVisibleID == ActiveArea.PLAY) {
            this.playTimeLabel.label = this.timeLabelString;
            
            if (this.playDurationLabel.label == "0:00" || this.playPipeState == PipelineStates.STOPPED) {
                //this.playDurationLabel.label = this.durationString;
                this.setProgressScaleSensitive();
                this.progressScale.set_range(0.0, duration);
            }
            this.progressScale.set_value(this.time);
        }
    },
});

const RecordButton = new Lang.Class({
    Name: "RecordButton",
    Extends: Gtk.Button,
    
    _init: function(activeProfile) {
        this._activeProfile = activeProfile;
        this.parent();
        this.set_label("Record");
        this.connect("clicked", Lang.bind(this, this._onRecord));
    },
    
    _onRecord: function() {
        view.setVisibleID = ActiveArea.RECORD;
        view.recordGrid.show_all();
        audioProfile.assignProfile();
        view._record.startRecording();
        wave = new Waveform.WaveForm(view.recordGrid);
    }
});

const PlayPauseButton = new Lang.Class({
    Name: "PlayPauseButton",
    Extends: Gtk.Button,
    
    _init: function() {
        //let playImage = Gtk.Image.new_from_icon_name("media-playback-start-symbolic", Gtk.IconSize.BUTTON);
        this.parent();
        //this.set_image(playImage);
    },
    
    _onPlayPauseToggled: function(listRow, selFile) {
        this.activeState = play.getPipeStates();
        view.setVisibleID = ActiveArea.PLAY;
        log(listRow);
        let width = listRow.get_allocated_width();
        if (this.activeState != PipelineStates.PLAYING) {
            play.startPlaying();
            log(this);
            
            let rowWidget = listRow.get_child(this.widget);
            log(rowWidget + "rowWidget");
            rowWidget.foreach(Lang.bind(this,
                function(child) {
                        
                        if (child.name == "InfoToolbar" || child.name == "DeleteToolbar" ) {
                            child.hide();
                            child.sensitive = false;
                        }
                    
                        if (child.name == "PlayLabelBox") {
                            child.foreach(Lang.bind(this, 
                                function(grandchild) {
                                
                                    if (grandchild.name == "PlayTimeLabel") {
                                        view.playTimeLabel = grandchild;
                                        log(view.playTimeLabelLabel)
                                    }
                                    
                                    if (grandchild.name == "DividerLabel" )
                                        grandchild.show();
                                }));
                        }
                                                     
                    if (child.name == "WaveFormGrid") {
                        this.wFGrid = child;
                        child.sensitive = true;
                    }
                }));
             log(this.activeState);
             log("activeState");
             listRow.set_property("width-request", width);
            
            if (this.activeState != PipelineStates.PAUSED) {
                wave = new Waveform.WaveForm(this.wFGrid, selFile);
            }

        } else if (this.activeState == PipelineStates.PLAYING) {
            play.pausePlaying();
        }
    }
});

const EncoderComboBox = new Lang.Class({
    Name: "EncoderComboBox",
    Extends: Gtk.ComboBoxText,
       
    // encoding setting labels in combobox
    _init: function() {
        this.parent();
        let combo = [_("Ogg Vorbis"), _("Ogg Opus"), _("FLAC"), _("MP3"), _("AAC")];
        
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
