AC_INIT([gnome-sound-recorder],[3.21.92],[gnome-sound-recorder])

AC_CONFIG_MACRO_DIR([m4])
AC_CONFIG_HEADERS([config.h])

AM_INIT_AUTOMAKE([1.11 foreign -Wno-portability tar-ustar dist-xz])
AM_SILENT_RULES([yes])

LT_INIT([disable-static])
GETTEXT_PACKAGE=gnome-sound-recorder
AC_SUBST(GETTEXT_PACKAGE)
AC_DEFINE_UNQUOTED(GETTEXT_PACKAGE, "$GETTEXT_PACKAGE",
                  [The prefix for our gettext translation domains.])
IT_PROG_INTLTOOL([0.26])

GLIB_GSETTINGS
GOBJECT_INTROSPECTION_REQUIRE([0.9.6])

GLIB_MIN_VERSION=2.46
GTK_MIN_VERSION=3.12
GOBJECT_INTROSPECTION_MIN_VERSION=1.31.6
PKG_CHECK_MODULES([DEPS], [gdk-3.0
                  gdk-pixbuf-2.0
                  glib-2.0 >= $GLIB_MIN_VERSION
                  gobject-introspection-1.0 >= $GOBJECT_INTROSPECTION_MIN_VERSION
                  gtk+-3.0 >= $GTK_MIN_VERSION])

AC_PATH_PROG(GJS, [gjs])

GLIB_COMPILE_RESOURCES=`$PKG_CONFIG --variable glib_compile_resources gio-2.0`
AC_SUBST(GLIB_COMPILE_RESOURCES)


AC_OUTPUT([
Makefile
data/Makefile
data/appdata/Makefile
data/icons/Makefile
src/Makefile
po/Makefile.in
])
