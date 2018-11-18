Activate the API on RHGamestation
============================

Edit the file `/rhgamestation/share/system/rhgamestation.conf` and set the parameter `system.api.enabled` to `1`.


```
system.api.enabled=1
```

Reboot and you can now access to the REST API on `http://RHGAMESTATION-IP:1337`
