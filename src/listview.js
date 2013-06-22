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

const tagItems = {
    Title: 0,
    DateCreated: 1
}; 

const enumerator = null;
const Listview = new Lang.Class({
    Name: "Listview",

    _init: function() {
        this._uris = [];
        this._enumeratorFlag = true;
        this._createdUrn = null;
    },
            
    enumerateDirectory: function() {

        let initialFileName = [];
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        let dirName = GLib.build_filenamev(initialFileName);
        let dir = Gio.file_new_for_path(dirName);    
      
        dir.enumerate_children_async('standard::name',
                                     Gio.FileQueryInfoFlags.NONE,
                                     GLib.PRIORITY_LOW, 
                                     null, Lang.bind(this, 
                                     this._onEnumerator)); 
    },  
           
    _onEnumerator: function(obj, res) {     
        this._enumerator = obj.enumerate_children_finish(res);
        
        if (this._enumerator == null)
            log("The contents of the Recordings directory were not indexed.");
        this._onNextFileComplete();        
    },
       
    _onNextFileComplete: function () {
        try{ 
            this._enumerator.next_files_async(1, GLib.PRIORITY_LOW, null, Lang.bind(this,  
                function(obj, res) {
                    this._discoverer = new GstPbutils.Discoverer();
                    this._discoverer.start(); 
                    let files = obj.next_files_finish(res);     
                    if (files.length) {
                        files.forEach(Lang.bind(this, 
                            function(file) { 
                                let returnedName = file.get_name().toString();
                                log(returnedName);
                                let initialFileName = [];
                                initialFileName.push(GLib.get_home_dir());
                                initialFileName.push(_("Recordings"));
                                let returnedName = file.get_name().toString();
                                initialFileName.push(returnedName);
                                let finalFileName = GLib.build_filenamev(initialFileName);
                                let uri = GLib.filename_to_uri(finalFileName, null);
                                this._discoverer.discover_uri_async(uri);
                                this._discoverer.connect('discovered', Lang.bind(this, 
                                    function(_discoverer, info, error) {
                                        this.finished = info.get_result(); 

                                        if (this.finished != GstPbutils.DiscovererResult.ERROR) {
                                            this.i = info.get_tags(info); 
                                            this.appName = this.i.get_string(Gst.TAG_APPLICATION_NAME);
                                            log(this.appName);
                                        }
                                    })); 
                        }));
                    } else {
                        log("done");
                        this._enumerator.close(null);
                   }
                    
                }));
        } catch(e) {
            log(e);
        } 
    },   
});
