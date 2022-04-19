# Freedom Units!

This is a demo Toga app implementing a Fahrenheit to Celsius converter.

## Initial setup

1. Create and activate a virtual environment:

       $ python -m venv venv
       $ . ./venv/bin/activate

2. Install the demo requirements:

       $ pip install -r requirements.txt

### Development details

This demo bakes a pre-compiled version of pyscript into the `server/pyscript`
directory.

It also includes an experimental version of toga-core, toga-web and toga-flask,
packaged as wheels in the `server/wheels` directory.

If any changes are made to the Toga sources or to PyScript, these vendored
resources will need to be updated.

## Web app

The web app is a demo Flask server, serving a web app version of Toga at the
root URL. To run the web demo server:

    $ cd server
    $ PYTHONPATH=../freedom/src python -m demo

then point your browser at http://localhost:8081/

Enter a value in the "farenheit" input, and click the "calculate" button.

It may take a few seconds for this button to become live; look for the
"Collecting nodes..." entry in the console log.

## Desktop app

To run this app in development mode:

    $ briefcase dev

To build and run an app bundle:

    $ briefcase run

If you're on an M1 macOS, this will raise an error on first run; if you get this error, run:

    $ briefcase package -p app --adhoc-sign

then re-run `briefcase run`

## iOS app

To run this in the iOS simulator, run:

    $ briefcase run iOS

To run this in the Android simulator, run:

    $ briefcase run android

Note that these builds have extensive requirements that must be installed -
Xcode for iOS, and the Android SDKs for Android. These are multiple gigabyte
downloads. Briefcase will detect when these tools aren't available, and either
prompt you to download them, or perform a download for you. As a result, your
first build may take up to 20 minutes to complete, depending on the speed of
your conection.
