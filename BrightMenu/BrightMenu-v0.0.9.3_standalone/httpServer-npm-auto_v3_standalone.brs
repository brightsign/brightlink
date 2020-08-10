
'disabled plugin message processing
'start server automatically
'tries to play server after unpack even if it works or fails. so server always tries to start.


Function httpServer_Initialize(msgPort As Object, userVariables As Object, bsp as Object)

    print "httpServer_Initialize - entry"

	httpServer = newhttpServer(msgPort, userVariables, bsp)
	
	return httpServer

End Function



Function newhttpServer(msgPort As Object, userVariables As Object, bsp as Object)
	  print "httpserver Plugin Object Created"

    	'
  	dl = createobject("roSystemLog")

	  ' Create the object to return and set it up
	  s = {}
    s.version = 0.7
	  s.msgPort = msgPort
	  s.userVariables = userVariables
	  s.bsp = bsp
	  s.ProcessEvent = httpServer_ProcessEvent
	  s.startserver = httpserver_startserver
    s.startadminserver = adminserver_startserver
	  s.sendmessage = httpServer_sendMessage
	  s.handlejsevent = httpServer_HandleJSEvent
    s.getVariableValues = httpServer_getVariableValues
    s.dgSocket = CreateObject("roDatagramSocket")
    s.dgSocket.BindToLocalPort(5901)
    s.dgSocket.SetPort(msgPort)

	  s.sTime = CreateObject("roSystemTime")
	  s.objectName = "httpServer_object"
	  s.firsttime = true
    s.registryFirstTime = true
    s.isAdminServerStart = false
    s.resetPasswordTimer = false
    s.rebootRequired = false
    s.adminSet = false
    s.AP_AP_Address="192.168.10.200"
    s.AP_Hostname="brightsign.biz"

    dl.SendLine("httpServer-npm-auto version: " + str(s.version))

    if s.registryFirstTime then
      rsNetworking = createobject("roregistrysection", "networking")
      bsnce = rsNetworking.read("bsnce")
      if bsnce <> "false" then
        rsNetworking.write("bsnce","false")
        rsNetworking.flush()
        s.rebootRequired = true
        'RebootSystem()	'reboots player first time it's changed
      endif
      
		  rsHtml = createobject("roregistrysection", "html")
      mp = rsHtml.read("mp")
      if mp <> "1" then
        rsHtml.write("mp","1")
        rsHtml.flush()
        s.rebootRequired = true
      endif

      if s.rebootRequired then
        dl.SendLine("Rebooting to reflect new registry values required.")
        RebootSystem()
      endif
      registryFirstTime = false

    endif

	's.StartTimer()
    if GetFiles(bsp) and Canwestart() then
        npmFile = CreateObject("roReadFile", "sd:/npm.zip") 
        if npmFile <> invalid then
            pkg = createobject("roBrightPackage", "sd:/npm.zip")
            dl.sendline("@@@@@@@@@@ "+pkg.getfailurereason())
            createdirectory("sd:/node")

            if pkg <> invalid then 
                pkg.unpack("/node")
                dl.sendline("@@@@@@@@@@Unpacked to node")
                Deletefile("npm.zip")
            else
                dl.sendline("@@@@@@@@@@Pkg invalid")			
            endif
        else
            print "Cannot find sd:/npm.zip"
        endif 
         ' instructions.zip including .png, jpg, that brightsign includes        

        instructionsFile = CreateObject("roReadFile", "sd:/instructions.zip") 
        if instructionsFile <> invalid then
            pkg = createobject("roBrightPackage", "sd:/instructions.zip")
            dl.sendline("@@@@@@@@@@ "+pkg.getfailurereason())

            uploadsDirEmpty = false
            if pkg <> invalid then 
                if ListDir("/uploads").Count() = 0 then
                    print "Creating /uploads"
                    uploadsDirEmpty = true
                    createdirectory("sd:/uploads")
                    if uploadsDirEmpty then 
                        pkg.unpack("/uploads")
                        dl.sendline("@@@@@@@@@@Unpacked to uploads")
                    end if
                endif
                Deletefile("instructions.zip")
            else
                dl.sendline("@@@@@@@@@@Pkg invalid")			
            endif
        else
            print "Cannot find sd:/instructions.zip"
        end if        
    end if
   
    s.startserver()
    s.startadminserver()

	  return s
	
End Function



Function httpServer_ProcessEvent(event As Object) as boolean
	
    m.getVariableValues()

	  retval = false
    print "httpserver_ProcessEvent - entry"
    print "type of m is ";type(m)
    print "type of event is ";type(event)
		
	if (m.firsttime) then
    print "apply forwarding policy"
		m.firsttime = false
		nc = createobject("ronetworkconfiguration", 0)
    ipReg = CreateObject("roRegex", "\.", "i")
    ipFields = ipReg.split(m.AP_AP_Address)
    ipConcat = ipFields[0] + "." + ipFields[1] + "." + ipFields[2] + ".0"
    print "ipConcat: ";ipConcat
		result = nc.setforwardingpolicy({ forwarding_enabled: false, nat_enabled: false, transparent_proxy: [{ src: { addr: ipConcat, prefix_len: 24 }, protocol: "tcp", from: { addr: ipConcat, port: 80, prefix_len: 0 }, to: { addr: m.AP_AP_Address, port: 88 } }, { src: { addr: ipConcat, prefix_len: 24 }, protocol: "tcp", from: { addr: ipConcat, port: 443, prefix_len: 0 }, to: { addr: m.AP_AP_Address, port: 443 } } ]})
    if result = false then
      print "setforwardingpolicy failed: ";nc.GetFailureReason();
    end if
		nc.apply()
    
    m.mpSvc = CreateObject("roMessagePort") 
    m.bsp.svcPort = CreateObject("roControlPort", "BrightSign")
    m.bsp.svcPort.SetUserData("BrightSign")
    m.bsp.svcPort.SetPort(m.mpSvc)
    m.bsp.svcPortIdentity = stri(m.bsp.svcPort.GetIdentity())
	endif


	if type(event) = "roHtmlWidgetEvent" then
		m.HandleJSEvent(event)
    
  else if type(event) = "roControlDown"  then
    ' stop
    ' if stri(event.GetSourceIdentity()) = stri(m.bsp.svcPort.GetIdentity()) then
      if event.GetInt() = 12 and m.isAdminServerStart = true and m.resetPasswordTimer = true then
        result = m.dgSocket.SendTo("127.0.0.1", 5902, "svcpressed!!true")
        print "Send svcpressed!!true: ";result 
        retval = true
        ' RestartApplication()
      else if event.GetInt() = 12 then
        retval = true
        ' Developers: If SVC functionality is expected, uncomment line below 
        ' stop
      end if
    ' end if
	else if type(event) = "roAssociativeArray" then		
		if type(event["EventType"]) = "roString"
		
		  et$=event["EventType"]
		  print "event type is" ;et$
    end if
  else if type(event) = "roDatagramEvent" then

    print event
    r = CreateObject("roRegex", "^httpserver", "i")
    match = r.IsMatch(event)
    if match then 
      r2 = CreateObject("roRegex", "!!", "i")
      fields = r2.split(event)
      if fields.Count() >= 2 and fields[0] = "httpserver" then
        if fields[1] = "reboot" then ' called by setting user variables in admin page
          retval = true
          print "RestartApplication() called in httpServer plugin"
          RestartApplication()
        else if fields[1] = "resetpasswordtimer" and fields[2] = "on" then
          retval = true
          print "resetPasswordTimer is on"
          m.resetPasswordTimer = true
        else if fields[1] = "resetpasswordtimer" and fields[2] = "off" then
          retval = true
          print "resetPasswordTimer is off"
          m.resetPasswordTimer = false
        end If
      end if
    end if
	end if

	return retval

End Function



Sub httpServer_StartServer()
	
		print " httpserver pluginMessage$ event received ||||| "; pluginMessage$
				r = CreateObject("roRectangle", 0,0,1920,1080)

				config = {
				  nodejs_enabled: true
				  security_params: {
					websecurity: false
				  }

				  'user_stylesheet: "sd:/autorun.css"
				  'url: "file:///sd:index.html"
				  url: "file:///sd:/node/portalServer.html"
				  'url: "file:///sd:/node/portal.js"
				  brightsign_js_objects_enabled: true
				  javascript_enabled: true
				  hwz_default: "on"
				  inspector_server: {
					port: 3000
				  }

				  mouse_enabled: true
				  focus_enabled: true
				  storage_path: "sd:/db"      
				  storage_quota: 10048576
				}

				m.htmlWidget = CreateObject("roHtmlWidget", r, config)
				m.htmlWidget.SetPort(m.msgport)
				m.htmlWidget.show()

End Sub


Sub adminServer_StartServer()
	
		print " expressServer pluginMessage$ event received ||||| "; pluginMessage$
    if CreateObject("roReadFile", "sd:/node/adminServer.html") <> invalid then
		 rs = createobject("roregistrysection", "html")
				mp = rs.read("mp")
				if mp <> "1" then
					rs.write("mp","1")
					rs.flush()
					RebootSystem()	'reboots player first time it's changed
				endif


				r = CreateObject("roRectangle", 0,0,1920,1080)
          config = {
            nodejs_enabled: true
            security_params: {
            websecurity: false
            }

            'user_stylesheet: "sd:/autorun.css"
            'url: "file:///sd:index.html"
            url: "file:///sd:/node/adminServer.html"
            'url: "file:///sd:/node/portal.js"
            brightsign_js_objects_enabled: true
            javascript_enabled: true
            hwz_default: "on"
            inspector_server: {
            port: 3000
            }

            mouse_enabled: true
            focus_enabled: true
            storage_path: "sd:/db-express"
            storage_quota: 10048576
          }

          m.htmlWidgetAdmin = CreateObject("roHtmlWidget", r, config)
          m.htmlWidgetAdmin.SetPort(m.msgport)
          m.htmlWidgetAdmin.show()
    end if
End Sub


Function GetFiles(pr as object) as Boolean
	slog = createobject("roSystemLog")
	slog.sendline("getfiles helper")

  okrun = false
  runpath$=""
  runpath$ = GetPoolFilePath(pr.assetPoolFiles, "npm.zip")

	if runpath$ <> "" then 
		okrun = Copyfile(runpath$, "npm.zip")
		print "copy npm.zip: ";okrun
		' if okrun then
        ' Deletefile(runpath$)
    ' end if
	
  else
		slog.sendline("One or more files didn't return a pool path")
		print "file found: ";okrun
	endif

  runpath2$ = GetPoolFilePath(pr.assetPoolFiles, "instructions.zip")

  okrun2 = false
	if runpath2$ <> "" then 
		  okrun2 = Copyfile(runpath2$, "instructions.zip")
		  print "copy instructions.zip: ";okrun2
		  ' if okrun2 then
          ' Deletefile(runpath2$)
      ' end if

  else
		slog.sendline("One or more files didn't return a pool path")
		print "instructions.zip file found: ";okrun2
	endif

    if okrun then
        return true
    else
        return false
    endif
    return false
	
end Function



Function Canwestart() as boolean
	slog = createobject("roSystemLog")
	slog.sendline("canwestart helper")

	auto = false
	mylist = matchfiles(".","*.zip")
  
	For each file in mylist
		print file
		If file ="npm.zip" then auto = true
		'if auto then Deletefile("npm.zip") 'new, from Julian
	Next
	
	print "auto: ";auto
	
	If auto then
		return true
	else
		return false
	endif

End Function


Sub httpServer_HandleJSEvent(origMsg as Object)

    jsm = origMsg.GetData()
    print jsm
    print "printing reason: "; jsm.reason

    if jsm.reason = "message" then
        print jsm.message
        
        if jsm.message.zonemessage <> invalid then
            command$ = jsm.message.zonemessage
            m.sendmessage(command$)
            if (m.userVariables["zonemessage"] <> invalid) then
                m.userVariables["zonemessage"].SetCurrentValue(command$, true)
            end if	
        else
            m.bsp.diagnostics.printdebug("@@@zonemessage not found / postmessage should be ")	
        endif
    elseif (jsm.url = "file:///sd:/node/adminServer.html" and jsm.reason = "load-finished") then
        result = m.dgSocket.SendTo("127.0.0.1", 5900, "hostname!!" + m.AP_Hostname)
        print "Send Captive portal UDP: ";result
        m.isAdminServerStart = true
    else
        print "NO Message in js object"
    endif

End Sub


sub httpServer_sendMessage(message$ as string) 
'send zone message
    sendZoneMessageParameter$ = message$
    zoneMessageCmd = CreateObject("roAssociativeArray")
    zoneMessageCmd["EventType"] = "SEND_ZONE_MESSAGE"
    zoneMessageCmd["EventParameter"] = sendZoneMessageParameter$
    m.msgPort.PostMessage(zoneMessageCmd)

end sub


Sub httpServer_getVariableValues()

	'AP_AP_Address="192.168.10.200"

    if (m.userVariables["ipaddress"] <> invalid) then 'v
        m.AP_AP_Address = m.userVariables["ipaddress"].GetCurrentValue()
    end if

    if (m.userVariables["hostname"] <> invalid) then
        m.AP_Hostname = m.userVariables["hostname"].GetCurrentValue()
    end if

end Sub
