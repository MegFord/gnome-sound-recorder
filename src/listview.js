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
 
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib; 

const Listview = new Lang.Class({
    Name: "Listview",
    
    enumerateDirectory: function() {
        let _allFiles = [];
        let initialFileName = [];
        initialFileName.push(GLib.get_home_dir());
        initialFileName.push(_("Recordings"));
        let dirName = GLib.build_filenamev(initialFileName);
        let dir = Gio.file_new_for_path(dirName);
        dir.enumerate_children_async('standard::namhttps://github.com/MegFord/gnome-sound-recorder/tree/githube,standard::type',
                                  Gio.FileQueryInfoFlags.NONE,
                                  GLib.PRIORITY_LOW, null, function (obj, res) {
        let enumerator = obj.enumerate_children_finish(res);
        function onNextFileComplete(obj, res) {
                let files = obj.next_files_finish(res);
                
                if (files.length) {
                    _allFiles = _allFiles.concat(files);                
                    enumerator.next_files_async(50, GLib.PRIORITY_LOW, null, onNextFileComplete);
                } else {
                    enumerator.close(null); 
                    return; 
                 }
        }
        enumerator.next_files_async(50, GLib.PRIORITY_LOW, null, onNextFileComplete);
        });
    },
    
    _retrieveFileInformation: function(fileList) {
        this._fileList = fileList;
        this._filelist.forEach(Lang.bind(this,
            function(file) { 
                let displayName = file.get_display_name();
                log(displayName);
                let contentType = file.get_content_type();
                log(contentType);
                let uri = file.get_uri();
            }));   
    }
});
