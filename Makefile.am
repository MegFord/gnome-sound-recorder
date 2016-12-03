ACLOCAL_AMFLAGS = -I m4

SUBDIRS = po data src

MAINTAINERCLEANFILES = \
	$(srcdir)/INSTALL \
	$(srcdir)/aclocal.m4 \
	$(srcdir)/autoscan.log \
	$(srcdir)/compile \
	$(srcdir)/config.guess \
	$(srcdir)/config.h.in \
	$(srcdir)/config.sub \
	$(srcdir)/configure.scan \
	$(srcdir)/depcomp \
	$(srcdir)/install-sh \
	$(srcdir)/ltmain.sh \
	$(srcdir)/missing \
	$(srcdir)/mkinstalldirs

GITIGNOREFILES = .anjuta .anjuta_sym_db.db m4/

distdir = $(PACKAGE_NAME)-$(VERSION)

@BEHAVE_INSTALLED_TESTS_RULE@
INSTALLED_TESTS = \
	test_app.feature \
	$(NULL)
INSTALLED_TESTS_TYPE = session-exclusive
-include $(top_srcdir)/git.mk
