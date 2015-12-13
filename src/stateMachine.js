/*
* Copyright 2015 Meg Ford
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
* License along with this library; if not, see <http://www.gnu.org/licenses/>.
*
* Author: Meg Ford <megford@gnome.org>
*
*/

const StateMachine = new Lang.Class({
    Name: "StateMachine",

       stateMachine: function(currentState)  {
        let rowWidget = listRow.get_child(this.widget);

        if (currentState == rowSelected) {
           if (previousSelRow != null) {
              rowWidget.foreach(Lang.bind(this,
                function(child) {
                    let alwaysShow = child.get_no_show_all();

                    if (!alwaysShow)
                        child.hide();

                    if (child.name == "PauseButton") {
                        child.hide();
                        child.sensitive = false;
                    }

                    if (child.name == "PlayLabelBox") {
                        child.show();
                        child.foreach(Lang.bind(this,
                            function(grandchild) {

                                if (grandchild.name == "PlayTimeLabel") {
                                    grandchild.hide();
                                }

                                if (grandchild.name == "DividerLabel" )
                                    grandchild.hide();
                             }));
                    }
                }));
        }
        else if (currentState == paused) {
            rowWidget.foreach(Lang.bind(this,
                function(child) {
                if (child.name == "PauseButton") {
                        child.hide();
                        child.sensitive = false;
                    }

                    if (child.name == "PlayButton" ) {
                        child.show();
                        child.sensitive = true;
                    }
            }));
        }
        else if (currentState == playing) {
            rowWidget.foreach(Lang.bind(this,
                function(child) {

                    if (child.name == "InfoButton" || child.name == "DeleteButton" ||
                        child.name == "PlayButton") {
                        child.hide();
                        child.sensitive = false;
                    }

                    if (child.name == "PauseButton") {
                        child.show();
                        child.sensitive = true;
                    }

                    if (child.name == "PlayLabelBox") {
                        child.foreach(Lang.bind(this,
                            function(grandchild) {

                                if (grandchild.name == "PlayTimeLabel") {
                                    view.playTimeLabel = grandchild;
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


        }
        else if (currentState == unselected){
            rowWidget.foreach(Lang.bind(this,
                function(child) {
                    let alwaysShow = child.get_no_show_all();

                    if (!alwaysShow)
                        child.hide();

                    if (child.name == "PauseButton") {
                        child.hide();
                        child.sensitive = false;
                    }

                    if (child.name == "PlayLabelBox") {
                        child.show();
                        child.foreach(Lang.bind(this,
                            function(grandchild) {

                                if (grandchild.name == "PlayTimeLabel") {
                                    grandchild.hide();
                                }

                                if (grandchild.name == "DividerLabel" )
                                    grandchild.hide();
                             }));
                    }
                }));
        }
        else if (currentState == stopPlaying) {
            rowWidget.foreach(Lang.bind(this,
                function(child) {

                    if (child.name == "PauseButton") {
                        child.hide();
                        child.sensitive = false;
                    } else {
                        child.show();
                        child.sensitive = true;
                    }
                }));
        }
    }
});
