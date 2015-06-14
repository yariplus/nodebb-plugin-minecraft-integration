# Minecraft Integration

**For support, visit the project's topic on the NodeBB Forums.**

**[https://community.nodebb.org/topic/3559](https://community.nodebb.org/topic/3559 "NodeBB Forums - Minecraft Integration")**

The Minecraft Integration project aims to reproduce and enhance widgets and features found on sites such as Enjin (XenForo-based) for use on a NodeBB forum. This plugin can be used alone, but widgets and features are enhanced when used with [minecraft-plugin-nodebb-integration](https://github.com/yariplus/bukkit-plugin-nodebb-integration/releases/download/v0.0.1/bukkit-nodebb-integration-0.0.1.jar).

Minecraft Integration is an evolution of my previous plugin [nodebb-widget-minecraft-essentials], repositories are redirected to this new project.

Compatible with NodeBB v0.7.0 and up. (I will ensure previous NodeBB version compatibility on request!)

## Installation

Two methods of installation:
1. Search for "nodebb-plugin-minecraft-integration" on the ACP Install Plugins page and click install.
or
2. Use npm from the command line in your NodeBB base directory: `npm install nodebb-plugin-minecraft-integration`. Then activate the plugin in the ACP Install Plugins page.

## Usage

Go to the **Installed Plugins->Minecraft Integration** page and to cofigure the plugin and enter your server's information.

![](http://puu.sh/inZMb/f06bdd48c1.png)

### Server Configuration

#### Server Name
This is the text displayed on widgets to identify the server. Minecraft formatting codes and Bukkit formatting codes are accepted here.

#### Server Address
This is the address users use in game to connect to the server. Supports any type of address. Defaults to "0.0.0.0:25565".

#### Query Port
This is the port to which the the plugin will send ServerQuery requests and ServerListPing requests. Defaults to 25565. (Does not have to be the actual server query port. For example, if you are using a bungee proxy, this can be the port for a child server instead of the proxy port.)

#### NodeBB-Integration Address
The address for your [minecraft-plugin-nodebb-integration] instance, if used. Defaults to "http://localhost:25665".

##### Server Configuration Example

![Server Example](http://puu.sh/inZS9/0c710bcf2f.png)

## Widgets

### Server Status Widget

Shows MOTD, min/max players, version, online player avatars, and other information about the Minecraft server. Displays everything in a pretty table. Custom rows can be added for things such as Mod Pack downloads, donation links, or any other html you wish to add.

![Server Status Widget Sample Image](http://yariplus.x10.mx/images/widgetServerStatus.png "Server Status Widget Sample Image")

### Mini Map Widget

Displays a Dynmap or Overviewer mini-map with configurable start location. (World/MapType/Coordinate).

![Dynmap Mini Map Sample Image](http://yariplus.x10.mx/images/widgetDynmapMiniMap.png "Dynmap Mini Map Sample Image")

### Online Players Graph Widget

A graph showing the number of player on the server recently. (Last 30 pings)

![Online Players Graph Sample Image](http://yariplus.x10.mx/images/widgetOnlinePlayersGraph.png "Online Players Graph Sample Image")

### Online Players Grid Widget

A grid of avatars of players currently on the server.

![Online Players Grid Sample Image](http://yariplus.x10.mx/images/widgetOnlinePlayersGrid.png "Online Players Grid Sample Image")

### Top Players List Widget

Displays user avatars in a list representing the top players' approximate play time.

![Top Players List Sample Image](http://yariplus.x10.mx/images/widgetTopPlayersList.png "Top Players List Sample Image")

### Top Players Graph Widget

A graphic chart (Pie) representing the top players' approximate play time.

![Top Players Graph Sample Image](http://yariplus.x10.mx/images/widgetTopPlayersGraph.png "Top Players Graph Sample Image")

### TPS Graph Widget

A graph showing the servers' recent Ticks per Second.

### Chat Widget

Show the in-game chat in a shoutbox-like widget. Send messages if your forum user is registered.

## Plugin API

Other apps can read data the plugin has collected via it's [API](https://github.com/yariplus/nodebb-plugin-minecraft-integration/wiki/API).

## Features in Development

* Character Profiles - A mini profile for your character.
* Gallery Widget - A selection of user-uploaded screen-shots.
* Server Page - A page just for server data.
* Directory Widget - Display notable character profiles.
* Ping Graph Widget - Display recent server pings.
