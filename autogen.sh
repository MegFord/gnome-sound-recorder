#!/bin/bash
# Run this to generate all the initial makefiles, etc.

srcdir=`dirname $0`
test -z "$srcdir" && srcdir=.

PKG_NAME="gnome-sound-recorder"
ACLOCAL_FLAGS="-I libgd $ACLOCAL_FLAGS"

test -f $srcdir/configure.ac || {
    echo -n "**Error**: Directory "\`$srcdir\'" does not look like the"
    echo " top-level gnome-sound-recorder directory"
    exit 1
}

which gnome-autogen.sh || {
    echo "You need to install gnome-common from GNOME Git (or from"
    echo "your OS vendor's package manager)."
    exit 1
}

(cd "$srcdir" ;
test -d m4 || mkdir m4/ ;
git submodule update --init --recursive ;
)
. gnome-autogen.sh
