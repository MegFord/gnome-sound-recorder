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

const MainWindow = imports.mainWindow;
const AudioProfile = imports.audioProfile;
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

const ListType = {
    NEW: 0,
    REFRESH: 1
};

const CurrentlyEnumerating = {
    TRUE: 0,
    FALSE: 1
};

let currentlyEnumerating = null; 
let stopVal = null;
let allFilesInfo = null;
let fileInfo = null;
let listType = null;
let startRecording = false; 

const Listview = new Lang.Class({
    Name: "Listview",

    _init: function() {
        stopVal = EnumeratorState.ACTIVE;
        allFilesInfo = [];
        this.mp3Caps = Gst.Caps.from_string("audio/mpeg, mpegversion=(int)1");
        this.oggCaps = Gst.Caps.from_string("audio/ogg");
        this.mp4Caps = Gst.Caps.from_string("video/quicktime, variant=(string)iso");
        this.flacCaps = Gst.Caps.from_string("audio/x-flac");
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
                                log(returnedName);
                                let timeVal = file.get_modification_time();
                                let date = GLib.DateTime.new_from_timeval_local(timeVal);
                                //log(date); // will this be buggy?
                                let dateModifiedSortString = date.format("%Y%m%d%H%M%S");
                                let dateModifiedDisplayString = date.format(_("%Y-%m-%d %H:%M:%S"));
                                //log(dateModifiedDisplayString); 
                                let dateCreatedYes = file.has_attribute("time::created");
                                //log(this.dateCreatedYes);
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
                                                            uri: null });
                            }));
                        this._sortItems(fileInfo);
                    } else {
                        log("done");
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
        log("sort");      
        this._fileArr = fileArr;
        allFilesInfo = allFilesInfo.concat(this._fileArr);
        allFilesInfo.sort(function(a, b) {
            return b.dateForSort - a.dateForSort; 
        }); 
        log("this._stopVal " + stopVal);
        if (stopVal == EnumeratorState.ACTIVE) {
            this._onNextFileComplete(); 
            log("sort done");
        } 
    }, 
    
    getItemCount: function() {
        log(allFilesInfo.length);
        return allFilesInfo.length;
    },
       
    _setDiscover: function() {
        this._controller = MainWindow.offsetController;
        this.totItems = this.getItemCount();
        this.startIdx = this._controller.getOffset();
        log("this.startIdx" + this.startIdx);
        this.ensureCount = this.startIdx + this._controller.getOffset() - 1; 
        
        if (this.ensureCount < this.totItems)
            this.endIdx = this.ensureCount;
        else
            this.endIdx = this.totItems - 1;

        this.idx = this.startIdx; 
        this._runDiscover();
        return false;
     },
     
     _runDiscover: function() {
        this.file = allFilesInfo[this.idx];
        this._buildFileName = new Record.BuildFileName();
        let initialFileName = this._buildFileName.buildPath();
        initialFileName.push(this.file.fileName);
        let finalFileName = GLib.build_filenamev(initialFileName);
        let uri = GLib.filename_to_uri(finalFileName, null);
        this.file.uri = uri;
        log(this.file.uri);
        this._discoverer = new GstPbutils.Discoverer();
        this._discoverer.start();                      
        this._discoverer.discover_uri_async(uri);
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
            //log(durationInfo);
            this.file.duration = durationInfo;
            
            if (title != null) {
                this.file.title = title;
                // add code to show title and date created below title
            }
             
            /* this.file.dateCreated will usually be null since time::created it doesn't usually exist. 
               Therefore, we prefer to set it with tags */
            if (dateTimeTag != null) {                
                dateTimeCreatedString = dateTimeTag.to_g_date_time();
                if (dateTimeCreatedString) {
                    this.file.dateCreated = dateTimeCreatedString.format(_("%Y-%m-%d %H:%M:%S")); 
                   // log("dateCreated" + this.file.dateCreated);
                } else if (this.dateCreatedString) {
                    this.file.dateCreated = this.dateCreatedString;
                }
            }              
            
            if (appString == GLib.get_application_name()) {
                this.file.appName = appString;
                //log(this.file.appName);
            }
            
            this._getCapsForList(info);
        } else {
        // don't index files we can't play
            log("File cannot be played"); 
        }
 
        if (this.idx < this.endIdx && this.idx >= 0) {
            this.idx++;
            log("this.listType discovering" + listType);
            this._runDiscover();
        } else { 
            this._discoverer.stop();
            log("this.listType discovering" + listType);
            MainWindow.offsetController.setEndIdx();
            
            if (listType == ListType.NEW) {
                MainWindow.view.listBoxAdd();
                MainWindow.view.scrolledWinAdd();
                currentlyEnumerating = CurrentlyEnumerating.FALSE;
                log("this.currentlyEnumerating new" +currentlyEnumerating);
            } else if (listType == ListType.REFRESH){
                MainWindow.view.scrolledWinDelete();
                currentlyEnumerating = CurrentlyEnumerating.FALSE;
                log("this.currentlyEnumerating " +currentlyEnumerating);
            }                
        }                                 
    },
    
    setListTypeNew: function() {
        listType = ListType.NEW;
    },    
        
    _onDirChanged: function(dirMonitor, file1, file2, eventType) {
        log("eventType" + eventType);
        if (eventType == Gio.FileMonitorEvent.DELETED || 
            (eventType == Gio.FileMonitorEvent.CHANGES_DONE_HINT && MainWindow.recordPipeline == MainWindow.RecordPipelineStates.STOPPED)) {
          stopVal = EnumeratorState.ACTIVE;
          allFilesInfo.length = 0;
          fileInfo.length = 0;
          log(stopVal + "this._stopVal");
          listType = ListType.REFRESH;
          log("this.listType" + listType);
          log("this.currentlyEnumerating " + currentlyEnumerating);
          if(currentlyEnumerating == CurrentlyEnumerating.FALSE) {
            currentlyEnumerating = CurrentlyEnumerating.TRUE;
            MainWindow.view.listBoxRefresh();
          }
        }
        
        if (eventType == Gio.FileMonitorEvent.CREATED)
            startRecording = true;
        log("MainWindow.recordPipeline" + MainWindow.recordPipeline);     
    },
    
    _getCapsForList: function(info) {
        let discovererStreamInfo = null;
        discovererStreamInfo = info.get_stream_info();
        let s = discovererStreamInfo.get_stream_type_nick();
           
        let containerStreams = info.get_container_streams()[0];
        let containerCaps = discovererStreamInfo.get_caps();
        //log(containerCaps.to_string());
        let audioStreams = info.get_audio_streams()[0];
        let audioCaps =  audioStreams.get_caps();
        //log(audioCaps.to_string()); 
        //log(this.file.fileName);         
                     
        if (containerCaps.is_subset(Gst.Caps.from_string(AudioProfile.containerProfileMap.OGG))) {           
            if (audioCaps.is_subset(Gst.Caps.from_string(AudioProfile.audioCodecMap.OGG_VORBIS)))
                this.file.mediaType = mediaTypeMap.OGG_VORBIS;
            else if (audioCaps.is_subset(Gst.Caps.from_string(AudioProfile.audioCodecMap.OPUS)))
                this.file.mediaType = mediaTypeMap.OPUS;
        } else if (containerCaps.is_subset(Gst.Caps.from_string(AudioProfile.containerProfileMap.MP3))) {
            if (audioCaps.is_subset(Gst.Caps.from_string(AudioProfile.audioCodecMap.MP3)))
                this.file.mediaType = mediaTypeMap.MP3;
        } else if (containerCaps.is_subset(Gst.Caps.from_string(AudioProfile.containerProfileMap.MP4))) {
            if (audioCaps.is_subset(Gst.Caps.from_string(AudioProfile.audioCodecMap.MP4)))
                this.file.mediaType = mediaTypeMap.MP4;
        } else if (audioCaps.is_subset(Gst.Caps.from_string(AudioProfile.audioCodecMap.FLAC))) {
            this.file.mediaType = mediaTypeMap.FLAC;
        } else if (containerCaps) { // !GstPbutils.DiscovererResult.OK should filter these out already
            let notKnownContainerCaps = GstPbutils.pb_utils_get_codec_description(containerCaps);
                
            if (notKnownContainerCaps) {
                this.file.mediaType = notKnownContainerCaps; 
            } else if (notKnownContainerCaps == null) {
                this.file.mediaType = ""; // provide the line with an empty string as placeholder if we have no info about the caps 
            }                              
        } else {
            let notKnownAudioCaps = GstPbutils.pb_utils_get_codec_description(audioCaps);
                
            if (notKnownAudioCaps) {
                this.file.mediaType = notKnownAudioCaps; 
            } else if (notKnownAudioCaps == null) {
                this.file.mediaType = ""; // provide the line with an empty string as placeholder if we have no info about the caps
            } 
        }        
    }, 
        
    getFilesInfoForList: function() {
        return allFilesInfo;
    },
    
    getEndIdx: function() {
    log(this.endIdx);
    log("endidx");
        return this.endIdx;
    }              
});


