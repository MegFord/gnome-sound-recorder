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
//./src/gnome-sound-recorder
 
imports.gi.versions.Gst = '1.0';

const _ = imports.gettext.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject; 
const Gst = imports.gi.Gst;
const GstPbutils = imports.gi.GstPbutils;
const Signals = imports.signals;

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
            log("nextFComp"); 
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
                                let s = file.get_modification_time();
                                let date = GLib.DateTime.new_from_timeval_local(s);
                                let dateModifiedSortString = date.format("%Y%m%d%H%M%S");
                                let dateModifiedDisplayString = date.format(_("%Y-%m-%d %H:%M:%S"));
                                log(s);
                                log(dateModifiedSortString);
                                log(returnedName);                                
                                this._fileInfo = this._fileInfo.concat({ fileName: returnedName, 
                                                                         dateForSort: dateModifiedSortString, 
                                                                         appName: null, 
                                                                         dateModified: dateModifiedDisplayString });
                            }));
                        this._set(this._fileInfo);
                    } else {
                        log("done");
                        this._stopVal = EnumeratorState.CLOSED;
                        this._enumerator.close(null);
                        this._runDiscover(); 
                        
                        return;
                   }                    
                }));
        } catch(e) {
            log(e);
        }
    }, 
    
    _set: function(fileArr) {
        
        this._fileArr = fileArr;
        this._allFilesInfo = this._allFilesInfo.concat(this._fileArr);
        log(this._allFilesInfo);
        this._allFilesInfo.sort(function(a, b) {
            return a.dateForSort - b.dateForSort;
        }); 
        this._allFilesInfo.forEach(Lang.bind(this, 
            function(file) { log(file.fileName)
            log(file.dateModified)}));
        log(this._stopVal);
        log("stval");
        
        if (this._stopVal == EnumeratorState.ACTIVE)
            this._onNextFileComplete();  
    }, 
        
    _runDiscover: function() {
        this._discoverer = new GstPbutils.Discoverer();
        this._discoverer.start();     
        this._allFilesInfo.forEach(Lang.bind(this, 
            function(file) { 
                let initialFileName = [];
                initialFileName.push(GLib.get_home_dir());
                initialFileName.push(_("Recordings"));
                initialFileName.push(file.fileName);
                log(file.fileName);
                log(file.dateModified);
                let finalFileName = GLib.build_filenamev(initialFileName);
                let uri = GLib.filename_to_uri(finalFileName, null);
                this._discoverer.discover_uri_async(uri);
                this._discoverer.connect('discovered', Lang.bind(this, 
                    function(_discoverer, info, error) {
                        this.finished = info.get_result(); 

                        if (this.finished != GstPbutils.DiscovererResult.ERROR) {
                            this.i = info.get_tags(info); 
                            file.appName = this.i.get_string(Gst.TAG_APPLICATION_NAME);
                                 log(file.appName);
                        }
                    }));
            }));
    }  
});
