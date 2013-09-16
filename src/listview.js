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
 *
 * Author: Meg Ford <megford@gnome.org>
 *
 */
//./src/gnome-sound-recorder
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject; 
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Signals = imports.signals;

const AudioProfile = imports.audioProfile;
const MainWindow = imports.mainWindow;
const Record = imports.record;

const EnumeratorState = { 
    ACTIVE: 0,
    CLOSED: 1
}; 

const mediaTypeMap = {
    OGG_VORBIS: "Ogg Vorbis",
    OPUS: "Opus",
    FLAC: "FLAC",
    MP3: "MP3",
    MP4: "MP4"
};

const codecDescription = {
    OGG: "Ogg",
    VORBIS: "Vorbis",
    OPUS: "Opus",
    ID3: "ID3 tag",
    MP3: "MPEG-1 Layer 3 (MP3)",
    QT: "Quicktime",
    MP4: "MPEG-4 AAC",
    FLAC: "Free Lossless Audio Codec (FLAC)"
};

const ListType = {
    NEW: 0,
    REFRESH: 1
};

const CurrentlyEnumerating = {
    TRUE: 0,
    FALSE: 1
};

let allFilesInfo = null;
let currentlyEnumerating = null; 
let fileInfo = null;
let listType = null;
let startRecording = false; 
let stopVal = null;

const Listview = new Lang.Class({
    Name: "Listview",

    _init: function() {
        stopVal = EnumeratorState.ACTIVE;
        allFilesInfo = [];
    },    
        
    monitorListview: function() {
        let dir = MainWindow.fileUtil.getDirPath(); 
        this.dirMonitor = dir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
        this.dirMonitor.connect('changed', this._onDirChanged);      
    },
            
    enumerateDirectory: function() {
        let dir = MainWindow.fileUtil.getDirPath();    
      
        dir.enumerate_children_async('standard::name,time::created,time::modified',
                                     Gio.FileQueryInfoFlags.NONE,
                                     GLib.PRIORITY_LOW, 
                                     null, Lang.bind(this, 
                                     this._onEnumerator)); 
    },  
           
    _onEnumerator: function(obj, res) {             
        this._enumerator = obj.enumerate_children_finish(res);
        
        if (this._enumerator == null)
            log("The contents of the Recordings directory were not indexed.");
        else   
            this._onNextFileComplete(); 
    },
    
    _onNextFileComplete: function () {
        fileInfo = [];
        try{
            this._enumerator.next_files_async(10, GLib.PRIORITY_DEFAULT, null, Lang.bind(this,
                function(obj, res) {
                    let files = obj.next_files_finish(res);
                    
                    if (files.length) {
                        files.forEach(Lang.bind(this,
                            function(file) {
                                let returnedName = file.get_attribute_as_string("standard::name");
                                let buildFileName = new Record.BuildFileName();
                                let initialFileName = buildFileName.buildPath();
                                initialFileName.push(returnedName);
                                let finalFileName = GLib.build_filenamev(initialFileName);
                                let fileUri = GLib.filename_to_uri(finalFileName, null);
                                let timeVal = file.get_modification_time();
                                let date = GLib.DateTime.new_from_timeval_local(timeVal);
                                let dateModifiedSortString = date.format("%Y%m%d%H%M%S");
                                let dateModifiedDisplayString = date.format(_("%Y-%m-%d %H:%M:%S"));
                                let dateCreatedYes = file.has_attribute("time::created");
                                if (this.dateCreatedYes) {
                                    let dateCreatedVal = file.get_attribute_uint64("time::created");
                                    let dateCreated = GLib.DateTime.new_from_timeval_local(dateCreatedVal);
                                    this.dateCreatedString = dateCreated.format(_("%Y-%m-%d %H:%M:%S"));
                                } 
                       
                                fileInfo = 
                                    fileInfo.concat({ appName: null,
                                                      dateCreated: null, 
                                                      dateForSort: dateModifiedSortString,                
                                                      dateModified: dateModifiedDisplayString,
                                                      duration: null,
                                                      fileName: returnedName,
                                                      mediaType: null,
                                                      title: null,
                                                      uri: fileUri });
                            }));
                        this._sortItems(fileInfo);
                    } else {
                        stopVal = EnumeratorState.CLOSED;
                        this._enumerator.close(null);
                        this._setDiscover();
                                                 
                        return;
                   }                    
                }));
        } catch(e) {
            log(e);
        }
    }, 
    
    _sortItems: function(fileArr) {      
        this._fileArr = fileArr;
        allFilesInfo = allFilesInfo.concat(this._fileArr);
        allFilesInfo.sort(function(a, b) {
            return b.dateForSort - a.dateForSort; 
        }); 

        if (stopVal == EnumeratorState.ACTIVE) {
            this._onNextFileComplete(); 
        } 
    }, 
    
    getItemCount: function() {
        log(allFilesInfo.length + "item count");
        return allFilesInfo.length;
    },
       
    _setDiscover: function() {
        this._controller = MainWindow.offsetController;
        this.endIdx = this._controller.getEndIdx(); 
        this.idx = 0;
        this._discoverer = new GstPbutils.Discoverer();
        this._discoverer.start();
        for (let i = 0; i <= this.endIdx; i++) {
            let file = allFilesInfo[i];
            let uri = file.uri;
            this._discoverer.discover_uri_async(uri);
        }
        this._runDiscover();
     },
     
     _runDiscover: function() {
          this._discoverer.connect('discovered', Lang.bind(this, 
            function(_discoverer, info, error) {
                let result = info.get_result();
                this._onDiscovererFinished(result, info, error); 
             })); 
    },
                        
    _onDiscovererFinished: function(res, info, err) {
        this.result = res;
        
        if (this.result == GstPbutils.DiscovererResult.OK) { 
            this.tagInfo = info.get_tags(info);
            let appString = "";
            let dateTimeCreatedString = ""; 
            appString = this.tagInfo.get_value_index(Gst.TAG_APPLICATION_NAME, 0);
            let dateTimeTag = this.tagInfo.get_date_time('datetime')[1]; 
            let title = this.tagInfo.get_string('title')[1];
            let durationInfo = info.get_duration();
            allFilesInfo[this.idx].duration = durationInfo;
            
            if (title != null) {
                this.file.title = title;
            }
             
            /* this.file.dateCreated will usually be null since time::created it doesn't usually exist. 
               Therefore, we prefer to set it with tags */
            if (dateTimeTag != null) {                
                dateTimeCreatedString = dateTimeTag.to_g_date_time();
                
                if (dateTimeCreatedString) {
                    allFilesInfo[this.idx].dateCreated = dateTimeCreatedString.format(_("%Y-%m-%d %H:%M:%S")); 
                } else if (this.dateCreatedString) {
                    allFilesInfo[this.idx].dateCreated = this.dateCreatedString;
                }
            }              
            
            if (appString == GLib.get_application_name()) {
                allFilesInfo[this.idx].appName = appString;
            }
            
            this._getCapsForList(info);
        } else {
        // don't index files we can't play
            log("File cannot be played"); 
        }
         
        if (this.idx == this.endIdx) { 
            this._discoverer.stop();
            
            if (listType == ListType.NEW) {
                MainWindow.view.listBoxAdd();
                MainWindow.view.scrolledWinAdd();
                currentlyEnumerating = CurrentlyEnumerating.FALSE;
            } else if (listType == ListType.REFRESH){
                MainWindow.view.scrolledWinDelete();
                currentlyEnumerating = CurrentlyEnumerating.FALSE;
            }
            return false; 
        } 
        
        this.idx++;                               
    },
    
    setListTypeNew: function() {
        listType = ListType.NEW;
    }, 
    
    setListTypeRefresh: function() {
        listType = ListType.REFRESH;
    },
        
    _onDirChanged: function(dirMonitor, file1, file2, eventType) {
        if (eventType == Gio.FileMonitorEvent.DELETED || 
            (eventType == Gio.FileMonitorEvent.CHANGES_DONE_HINT && MainWindow.recordPipeline == MainWindow.RecordPipelineStates.STOPPED)) {
            stopVal = EnumeratorState.ACTIVE;
            allFilesInfo.length = 0;
            fileInfo.length = 0;
            listType = ListType.REFRESH;
            
            if (currentlyEnumerating == CurrentlyEnumerating.FALSE) {
                currentlyEnumerating = CurrentlyEnumerating.TRUE;
                MainWindow.view.listBoxRefresh();
            }
        }
        
        if (eventType == Gio.FileMonitorEvent.CREATED)
            startRecording = true;    
    },
    
    _getCapsForList: function(info) {
        let discovererStreamInfo = null;
        discovererStreamInfo = info.get_stream_info();
        let s = discovererStreamInfo.get_stream_type_nick();
        let containerStreams = info.get_container_streams()[0];
        let containerCaps = discovererStreamInfo.get_caps();
        let audioStreams = info.get_audio_streams()[0];
        let audioCaps =  audioStreams.get_caps();

     
        if (GstPbutils.pb_utils_get_codec_description(containerCaps) == codecDescription.OGG) { 
                  
            if (GstPbutils.pb_utils_get_codec_description(audioCaps) == codecDescription.VORBIS) 
                allFilesInfo[this.idx].mediaType = mediaTypeMap.OGG_VORBIS;
            else if (GstPbutils.pb_utils_get_codec_description(audioCaps) == codecDescription.OPUS) 
                allFilesInfo[this.idx].mediaType = mediaTypeMap.OPUS;

        } else if (GstPbutils.pb_utils_get_codec_description(containerCaps) == codecDescription.ID3) {
        
            if (GstPbutils.pb_utils_get_codec_description(audioCaps) == codecDescription.MP3) 
                allFilesInfo[this.idx].mediaType = mediaTypeMap.MP3;

        } else if (GstPbutils.pb_utils_get_codec_description(containerCaps) == codecDescription.QT) {
        
            if (GstPbutils.pb_utils_get_codec_description(audioCaps) == codecDescription.MP4) 
                allFilesInfo[this.idx].mediaType = mediaTypeMap.MP4;              

        } else if (GstPbutils.pb_utils_get_codec_description(audioCaps) == codecDescription.FLAC) {
            allFilesInfo[this.idx].mediaType = mediaTypeMap.FLAC; 
                      
        } else {
        
            if (allFilesInfo[this.idx].mediaType == null) {
                allFilesInfo.splice(this.idx, 1); // Remove the file from the array if we don't recognize it
            }       
        }        
    }, 
        
    getFilesInfoForList: function() {
        return allFilesInfo;
    }        
});


