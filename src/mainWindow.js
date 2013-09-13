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
const Preferences = imports.preferences;
const Record = imports.record;
const Waveform = imports.waveform;

let activeProfile = null;
let audioProfile = null;
let fileUtil = null;
let grid = null;
let groupGrid;
let list = null;
let loadMoreButton = null;
let offsetController = null;
let path = null;
let play = null;
let previousSelRow = null;
let recordPipeline = null;
let recordButton = null;
let selectable = null;
let setVisibleID = null;
let UpperBoundVal = 182;
let view = null;
let volumeValue = [];
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

const RecordPipelineStates = {
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
        fileUtil = new FileUtil.FileUtil();
        offsetController = new FileUtil.OffsetController;
        view = new MainView();
        play = new Play.Play();
        
        params = Params.fill(params, { title: GLib.get_application_name(), //change this
                                       default_width: 700,
                                       default_height: 480 });
        this.parent(params);
        
        grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                              halign: Gtk.Align.CENTER,
                              height_request: 109,
                              width_request: 900,
                              border_width: 12,
                              vexpand: false });
        grid.set_row_homogeneous(true);
        let stackSwitcher = Gtk.StackSwitcher.new();
        stackSwitcher.set_stack(view);
        let header = new Gtk.HeaderBar({ hexpand: true });
        header.set_show_close_button(true);
        this.set_titlebar(header);
        
        let recordToolbar = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL,
                                          spacing: 0 });
        header.pack_start(recordToolbar);
        recordButton = new RecordButton({ label: "Record",
                                              margin_bottom: 4,
                                              margin_top: 6,
                                              margin_left: 6,
                                              margin_right: 6 });
        recordToolbar.pack_end(recordButton, false, true, 0);
        recordToolbar.get_style_context().add_class('header');
        recordToolbar.show();
        recordButton.show();

        grid.add(view);
            
        this._defineThemes();
                
        this.add(grid);
        grid.show_all();
        this.show_all();
        log("grid" + grid.get_preferred_height());
    },
       
    _defineThemes: function() {
        let settings = Gtk.Settings.get_default();
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
            
        this.labelID = null;
    },
    
    _addListviewPage: function(name) {
        fileUtil = new FileUtil.FileUtil();
        list = new Listview.Listview();
        list.setListTypeNew();
        list.enumerateDirectory();
        this._record = new Record.Record(audioProfile);
        let initialPage = new Gtk.EventBox();
        
        groupGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                   halign: Gtk.Align.CENTER,
                                   valign: Gtk.Align.CENTER,
                                   row_spacing: 12,
                                   column_homogeneous: true });
        groupGrid.add(initialPage);
        this.add_titled(groupGrid, name, "View");
    },
    
    onPlayStopClicked: function() {
        //recordButton.set_sensitive(true);
        play.stopPlaying();
    },
    
    onRecordStopClicked: function() {
        this._record.stopRecording();
        this.recordGrid.hide();
        recordPipeline = RecordPipelineStates.STOPPED;
        recordButton.set_sensitive(true);  
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
    
    presetVolume: function(source, vol) {
        if (source == ActiveArea.PLAY)
            volumeValue[0].play = vol;
        else
            volumeValue[0].record = vol;               
    },
    
    setVolume: function() {
        if (setVisibleID == ActiveArea.PLAY) {
        log("volumeValue.play " + volumeValue[0].play);
            play.setVolume(volumeValue[0].play);
        } else if (setVisibleID == ActiveArea.RECORD) {
           this._record.setVolume(volumeValue[0].record);
        }
    },
    
    getVolume: function() {
        let volumeValue = this.playVolume.get_value();

        return volumeValue;
    },
    
    listBoxAdd: function() {
        selectable = true;
        this.groupGrid = groupGrid;
        volumeValue.push({ record: 0.5, play: 0.5 });
        activeProfile = AudioProfile.comboBoxMap.OGG_VORBIS;
                
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
    },
     
    scrolledWinAdd: function() {       
        this._scrolledWin = new Gtk.ScrolledWindow({ shadow_type: Gtk.ShadowType.IN,
                                                     margin_bottom: 3,
                                                     margin_top: 5,
                                                     hexpand: false,
                                                     vexpand: false,
                                                     width_request: 900,
                                                     height_request: 400 });
        this._scrolledWin.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        this._scrolledWin.get_style_context().add_class('view');
        this.scrollbar = this._scrolledWin.get_vadjustment();
        
        this.scrollbar.connect("value_changed", Lang.bind(this, 
            function() {
                this.currentBound = this.scrollbar.get_value();
                UpperBoundVal = this.scrollbar.upper - this.scrollbar.page_size;
                if (UpperBoundVal == this.currentBound && loadMoreButton == null) {
                    this.addLoadMoreButton();
                } else if (UpperBoundVal != this.currentBound && loadMoreButton) {
                    loadMoreButton.destroy();
                    loadMoreButton = null;
                }
            }));
                  
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
        
        this._startIdx = 0;
        log(this._startIdx);
        log("start");
        this._endIdx = offsetController.getcidx();
        log(this._endIdx);
        this._files = [];
        this._files = list.getFilesInfoForList();
        
        for (let i = this._startIdx; i <= this._endIdx; i++) {
            this.rowGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                          height_request: 45,
                                          width_request: 900,
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
                    this._playListButton.onPlayPauseToggled(row, file);
                }));
            
            this._fileName = new Gtk.Label({ use_markup: true,
                                             halign: Gtk.Align.START,
                                             valign: Gtk.Align.START,
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
                                               name: "PlayLabelBox",
                                               height_request: 36 });
            this.rowGrid.attach(this._playLabelBox, 2, 1, 1, 1);
            this._playLabelBox.show();
                    
            this.playDurationLabel = new Gtk.Label({ margin_left: 15,
                                                     halign: Gtk.Align.END,
                                                     valign: Gtk.Align.END,
                                                     margin_top: 5,
                                                     name: "PlayDurationLabel" });
            this.fileDuration = this._formatTime(this._files[i].duration/Gst.SECOND);
            log(this.fileDuration + "FILEDURATION");
            log(this._files[i].duration);
            this.playDurationLabel.label = this.fileDuration;
            this._playLabelBox.pack_start(this.playDurationLabel, false, true, 0);
            this.playDurationLabel.show();
            
            this.dividerLabel = new Gtk.Label({ halign: Gtk.Align.START,
                                                name: "DividerLabel",
                                                valign: Gtk.Align.END,
                                                margin_top: 5 });
            this.dividerLabel.label = "/";
            this._playLabelBox.pack_start(this.dividerLabel, false, true, 0);
            this.dividerLabel.hide();
            
            this.playTimeLabel = new Gtk.Label({ halign: Gtk.Align.START,
                                                 name: "PlayTimeLabel",
                                                 valign: Gtk.Align.END,
                                                 margin_top: 5 });
            this.playTimeLabel.label = "0:00";
            this._playLabelBox.pack_start(this.playTimeLabel, false, true, 0);
            this.playTimeLabel.hide();
            
            this.waveFormGrid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                               height_request: 45,
                                               width_request: 350,
                                               valign: Gtk.Align.FILL,
                                               name: "WaveFormGrid" });
            this.waveFormGrid.set_no_show_all(true);
            this.rowGrid.attach(this.waveFormGrid, 9, 1, 1, 2);

            this.waveFormGrid.show();

            this.widgetInfo = new Gtk.Toolbar({ show_arrow: false,
                                                halign: Gtk.Align.END,
                                                valign: Gtk.Align.FILL,
                                                icon_size: Gtk.IconSize.BUTTON,
                                                opacity: 1,
                                                name: "InfoToolbar" });
            this.rowGrid.attach(this.widgetInfo, 10, 0, 1, 2);
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
            this.rowGrid.attach(this.widgetDelete, 11, 0, 1, 2);
            
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
        list.monitorListview();
    },
    
    addLoadMoreButton: function() {
       loadMoreButton = new LoadMoreButton();
       loadMoreButton.connect('clicked', Lang.bind(this, loadMoreButton.onLoadMore)); 
       this.groupGrid.add(loadMoreButton);
       loadMoreButton.show();      
    },
    
    listBoxRefresh: function() {
        previousSelRow = null;
        this.listBox.set_selection_mode(Gtk.SelectionMode.NONE);  
        list.enumerateDirectory();
        //this.listBox.set_selection_mode(Gtk.SelectionMode.SINGLE);          
    },
    
    listBoxLoadMore: function() {
       loadMoreButton.destroy();
       loeadMoreButton = null;
       this.listBox.set_selection_mode(Gtk.SelectionMode.NONE);
       offsetController.increaseEndIdxStep();
       list.setListTypeRefresh();
       list._setDiscover();
       this.listBox.set_selection_mode(Gtk.SelectionMode.SINGLE);
    },
    
    scrolledWinDelete: function() {
        let w = this.rowGrid.get_allocated_width();
        this._scrolledWin.destroy();
        this.scrolledWinAdd();
        log("destroy " + w);  
    },
    
    hasPreviousSelRow: function() {
       log("this._selectedRow  " + previousSelRow);
           if (previousSelRow != null) {
              let rowWidget = previousSelRow.get_child(this.widget);
              rowWidget.foreach(Lang.bind(this,
                function(child) {
                    let alwaysShow = child.get_no_show_all();
                    
                    if (!alwaysShow)
                        child.hide();
                }));
                this.activeState = play.getPipeStates();
                
                if (this.activeState == PipelineStates.PLAYING || this.activeState == PipelineStates.PAUSED) {
                log("this.activeState == PipelineStates.PLAYING");
                    play.stopPlaying();
                }
            } 
        previousSelRow = null;
    }, 
    
    rowGridCallback: function(selectedRow) {
        if (selectedRow) {
            log("this._selectedRow  " + previousSelRow);
            if (previousSelRow != null) {
                this.hasPreviousSelRow();
            }  
                          
            previousSelRow = selectedRow;
            let selectedRowWidget = previousSelRow.get_child(this.widget);
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
            
                if (child.name == "FileNameLabel") {
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
        let infoDialog = new Info.InfoDialog(selected);

        infoDialog.widget.connect('response', Lang.bind(this,
            function(widget, response) {
                infoDialog.widget.destroy();
            }));
    },   
        
    setLabel: function(time) {
        this.time = time
        this.playPipeState = play.getPipeStates();
        
        this.timeLabelString = this._formatTime(time);
        
        if (setVisibleID == ActiveArea.RECORD) {
            this.recordTimeLabel.label = this.timeLabelString;
            this.recordTimeLabel.get_style_context().add_class('dim-label');
        } else if (setVisibleID == ActiveArea.PLAY) {
            this.playTimeLabel.label = this.timeLabelString;
        }
    },
});

const RecordButton = new Lang.Class({
    Name: "RecordButton",
    Extends: Gtk.Button,
    
    _init: function(activeProfile) {
        this.parent();
        this.set_label("Record");
        this.connect("clicked", Lang.bind(this, this._onRecord));
    },
    
    _onRecord: function() {
        view.hasPreviousSelRow();
        view.listBox.set_selection_mode(Gtk.SelectionMode.NONE);
        this.set_sensitive(false);
        setVisibleID = ActiveArea.RECORD;
        view.recordGrid.show_all();
        
        if (activeProfile == null)
            activeProfile = 0; 
        audioProfile.assignProfile(activeProfile);
        view._record.startRecording(activeProfile);
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
    
    onPlayPauseToggled: function(listRow, selFile) {
        this.activeState = play.getPipeStates();
        setVisibleID = ActiveArea.PLAY;
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
        let combo = [_("Ogg Vorbis"), _("Opus"), _("FLAC"), _("MP3"), _("AAC")];
        
        for (let i = 0; i < combo.length; i++)
            this.append_text(combo[i]);
            
        this.set_sensitive(true);
        this.set_active(activeProfile);
        this.connect("changed", Lang.bind(this, this._onComboBoxTextChanged));
    },
   
    _onComboBoxTextChanged: function() {
        activeProfile = this.get_active();
    }
});

const LoadMoreButton = new Lang.Class({
    Name: 'LoadMoreButton',
    Extends: Gtk.Button,

    _init: function() {
        this.parent();
        this._block = false;

        // Translators: "more" refers to recordings in this context
        let label = new Gtk.Label({ label: _("Load More"),
                                    visible: true });

        this.label = _("Load More");                                       
        this.get_style_context().add_class('documents-load-more');
    },
     
    onLoadMore: function() {   
        //offsetController.increaseOffset();
        UpperBoundVal += 182;
        view.scrollbar.set_upper(UpperBoundVal);
        view.listBoxLoadMore();        
    }
}); 
