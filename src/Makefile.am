## Process this file with automake to produce Makefile.in

## Created by Anjuta  

jsdir = $(pkgdatadir)
dist_js_DATA = \
    util.js	\   
    audioProfile.js \
    fileUtil.js \
    info.js \
    listview.js \
    main.js \
    mainWindow.js \
    package.js	\
    play.js \
    record.js \
    waveform.js\
    $(NULL)
    
 nodist_bin_SCRIPTS = gnome-sound-recorder
    
$(PACKAGE_NAME): $(PACKAGE_NAME).in
	$(AM_V_GEN) sed \
		-e "s|[@]GJS@|$(GJS)|g" \
		-e "s|[@]PACKAGE_NAME@|$(PACKAGE_NAME)|g" \
		-e "s|[@]PACKAGE_VERSION@|$(PACKAGE_VERSION)|g" \
		-e "s|[@]prefix@|$(prefix)|g" \
		-e "s|[@]libdir@|$(libdir)|g" \
		-e "s|[@]pkgdatadir@|$(pkgdatadir)|g" \
		$< > $@
	@chmod +x $@

EXTRA_DIST = $(PACKAGE_NAME).in 
CLEANFILES = $(PACKAGE_NAME) 

-include $(top_srcdir)/git.mk
