# Minecraft Integration

**For support, visit the project's topic on the NodeBB Forums.**

**[https://community.nodebb.org/topic/3559](https://community.nodebb.org/topic/3559 "NodeBB Forums - Minecraft Integration")**

The goal of this project is to reproduce and enhance features found on sites such as Enjin (XenForo) for use on a NodeBB forum.

Compatible with NodeBB v0.5.7 and up.

## Installation

Use npm from the command line in your NodeBB base directory:

    npm install nodebb-plugin-minecraft-integration

Or for bleeding edge builds, you can pull from github:

    npm install git://github.com/yariplus/nodebb-plugin-minecraft-integration.git

## Usage

1. After installation, go to the ACP and enable the plugin.
2. Go to the **Installed Plugins->Minecraft Integration** page to configure your Minecraft server(s).

## Configuration

[https://community.nodebb.org/topic/3559](https://community.nodebb.org/topic/3559 "NodeBB Forums - Minecraft Integration")

## Widgets

### Server Status Widget

Shows MOTD, min/max players, version, online player avatars, and other information about the Minecraft server. Displays everything in a pretty table. Custom rows can be added for things such as Mod Pack downloads, donation links, or any other html you wish to add.

![Server Status Widget Sample Image](http://yariplus.x10.mx/images/widgetServerStatus.png "Server Status Widget Sample Image")

### Dynmap Mini Map Widget

Displays a mini Dynmap with configurable start location. (World/MapType/Coordinate).

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

## Widgets in Development

* Ping Graph - A graph showing the servers' recent ping times. (Last 30 pings)
* TPS Graph - A graph showing the servers' recent Ticks per Second. (Last 30 pings, requires Bukkit)
* Donators List - Displays user avatars and related graphics in a list representing the players' total donations.
* Store Items - Displays graphics for and links to items in the server store. (Buycraft etc..)
* Daylight Cycle - Alters page colors based on the server time. (PlanetMinecraft.com uses a widget like this, requires RCON, and requires bukkit or 1.7+)
* Stat Grabber - Use regular expressions to grab statistics from plugins such as McMMO or Vault and display them in a list or graph.

## Contributing

Contributing requires agreeing to the CLA, which will make your contribution Public Domain.
