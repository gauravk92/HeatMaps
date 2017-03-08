# Heatmaps Viewer

####[VIEW DEMO](https://cdn.rawgit.com/gauravk92/HeatMaps/master/projects/Heatmaps/build/output/0.html)

![Heatmaps Screenshot](https://github.com/gauravk92/HeatMaps/raw/master/Screenshot 2017-03-07 21.47.08.jpg)

## Setup & Install

npm install

bower install

npm install -g grunt-cli

sudo easy_install pip

pip install csvkit

##### serve “debug” where files are not inlined
grunt serve --project PROJECT_NAME_IN_PROJECTS_FOLDER --debug

##### serve to localhost:4000/projects/PROJECT_NAME
##### can open build with survey.csv at localhost:4000/projects/PROJECT_NAME/build/output/
grunt serve --project PROJECT_NAME_IN_PROJECTS_FOLDER

##### build to prod, copy build/index.min.html to clipboard
grunt serve —-project PROJECT_NAME_IN_PROJECTS_FOLDER --prod
