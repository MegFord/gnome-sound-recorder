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
//./src/gnome-sound-recorder
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject; 
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Signals = imports.signals;

const Application = imports.application;

const EnumeratorState = { 
    ACTIVE: 0,
    CLOSED: 1
};    

const Listview = new Lang.Class({
    Name: "Listview",

    _init: function() {
        this._stopVal = EnumeratorState.ACTIVE;
        this._allFilesInfo = [];
    },
            
    enumerateDirectory: function() {

        let initialFileName = [];
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        let dirName = GLib.build_filenamev(initialFileName);
        let dir = Gio.file_new_for_path(dirName);    
      
        dir.enumerate_children_async('standard::name,standard::sort-order,time::modified',
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
        this._fileInfo = [];
        try{
            this._enumerator.next_files_async(10, GLib.PRIORITY_LOW, null, Lang.bind(this,
                function(obj, res) {
                    let files = obj.next_files_finish(res);
                    
                    if (files.length) {
                        files.forEach(Lang.bind(this,
                            function(file) {
                                let returnedName = file.get_attribute_as_string("standard::name");
                                let timeVal = file.get_modification_time();
                                let date = GLib.DateTime.new_from_timeval_local(timeVal); // will this be buggy?
                                let dateModifiedSortString = date.format("%Y%m%d%H%M%S");
                                let dateModifiedDisplayString = date.format(_("%Y-%m-%d %H:%M:%S"));                               
                                this._fileInfo = this._fileInfo.concat({ fileName: returnedName, 
                                                                         dateForSort: dateModifiedSortString, 
                                                                         appName: null, 
                                                                         dateModified: dateModifiedDisplayString });
                            }));
                        this._sortItems(this._fileInfo);
                    } else {
                        log("done");
                        this._stopVal = EnumeratorState.CLOSED;
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
        this._allFilesInfo = this._allFilesInfo.concat(this._fileArr);
        this._allFilesInfo.sort(function(a, b) {
            return a.dateForSort - b.dateForSort;
        }); 
        
        if (this._stopVal == EnumeratorState.ACTIVE)
            this._onNextFileComplete();  
    }, 
    
    getItemCount: function() {
        log(this._allFilesInfo.length);
        return this._allFilesInfo.length;
    },
       
    _setDiscover: function() {
        this._discoverer = new GstPbutils.Discoverer();
        this._discoverer.start();
        this._controller = Application.offsetController;
        this.totItems = this.getItemCount();
        let startIdx = this._controller.getOffset();
        log(startIdx);
        this.ensureCount = startIdx + this._controller.getOffsetStep() - 1;
        
        if (this.ensureCount < this.totItems)
            this.endIdx = this.ensureCount;
        else
            this.endIdx = this.totItems - 1;
        log(this.endIdx);
        this.idx = startIdx;   
        this._runDiscover();
     },
     
     _runDiscover: function() {
        this.file = this._allFilesInfo[this.idx]; // this is repetitive, find all the places where this is done and consolidate
        let initialFileName = [];
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        initialFileName.push(this.file.fileName);
        let finalFileName = GLib.build_filenamev(initialFileName);
        let uri = GLib.filename_to_uri(finalFileName, null);
                                
        this._discoverer.discover_uri_async(uri);
        this._discoverer.connect('discovered', Lang.bind(this, 
            function(_discoverer, info, error) {
                let result = info.get_result(); 
                this._onDiscovererFinished(result, info, error); 
             }));
    },
                        
    _onDiscovererFinished: function(res, info, err) {
        this.result = res;
        
        if (this.result != GstPbutils.DiscovererResult.ERROR) { // How do I recover from the error?
            this.tagInfo = info.get_tags(info);
            let appString = ""; 
            appString = this.tagInfo.get_value_index(Gst.TAG_APPLICATION_NAME, 0);
                            
            if(appString == GLib.get_application_name()) {
                this.file.appName = appString;
            }
        } 

        if (this.idx < this.totItems && this.idx < this.endIdx) { // Some of this logic is probably unnecessary
            this.idx++;
            this._runDiscover();
        } else { 
            this._discoverer.stop();
        } 
    }         
});


