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
// ./src/gnome-sound-recorder
 
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
    
    enumerateDirectory: function() {

        let initialFileName = [];
        
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        let dirName = GLib.build_filenamev(initialFileName);
        let dir = Gio.file_new_for_path(dirName);
        
        try{
            dir.enumerate_children_async('standard::name',
                                     Gio.FileQueryInfoFlags.NONE,
                                     GLib.PRIORITY_LOW, null, 
                                     function (obj, res) {            
                this.enumerator = obj.enumerate_children_finish(res);
            });
         } catch(e) {
            log("The contents of the Recordings directory were not indexed.");
         } 
        // this.onNextFileComplete(); 
    },
       
    onNextFileComplete: function () {
        let discoverer = new GstPbutils.Discoverer();
        discoverer.start();
        let tagList = Gst.TagList.new_empty();
        let _uris = [];
        this.enumerator.next_files_async(2, GLib.PRIORITY_LOW);  
        let files = obj.next_files_finish(res);
                
        if (files.length) {
            files.forEach(Lang.bind(this, 
                function(file) { 
                    let initialFileName = [];
                    initialFileName.push(GLib.get_home_dir());
                    initialFileName.push(_("Recordings"));
                    let returnedName = file.get_name().toString();
                    initialFileName.push(returnedName);
                    let finalFileName = GLib.build_filenamev(initialFileName);
                    let uri = GLib.filename_to_uri(finalFileName, null);
                    discoverer.discover_uri_async(uri);
                    discoverer.connect('discovered', Lang.bind(this, 
                                function(discoverer, info, error) {
                                    this.finished = info.get_result(); 
                                               
                                    if (this.finished != GstPbutils.DiscovererResult.ERROR) {
                                        this.i = info.get_tags(info); 
                                        this.appName = this.i.get_string(GST_TAG_APPLICATION_NAME);
                                        log(this.appName);
                                        this.dateTime = this.i.get_string(Gst.TAG_DATE_TIME);
                                        this.title = this.i.get_string(Gst.TAG_SHOW_NAME);
                                    }
                                }));
                        }));                     
                                   
                    enumerator.next_files_async(2, GLib.PRIORITY_LOW);
                } else {
                    enumerator.close(null);
                    return;
                } 
            }    
});
