'16/04/20 Set player as Wifi access point to interact with the device web page
'AP access credential
'SSID = Set from user variable
'Password = Set from user variable
'Player DWS is reacheable on ip address:81
'if the Blue LED is not ON the player AP will not be reacheable

Function Access_Initialize(msgPort As Object, userVariables As Object, bsp as Object)

    print "Access_Initialize - entry"


    Access = newAccess(msgPort, userVariables, bsp)
	SetAccessPointConfig(Access)
	
    return Access

End Function


Sub SetAccessPointConfig(bsp as object)

	bsp.getVariableValues()	'retrieve variable values

	dlog = createobject("roSystemLog")
	m.PluginNetworkConf = CreateObject("roNetworkConfiguration",1)
	
    print ("Configuring Wi-Fi adapter as access point")
    m.PluginNetworkConf.setWiFiESSID(bsp.AP_SSID)
    m.PluginNetworkConf.setWiFiPassphrase(bsp.AP_Password)
    m.PluginNetworkConf.setIP4Address(bsp.AP_AP_Address)
    m.PluginNetworkConf.setIP4Netmask("255.255.255.0")
    m.PluginNetworkConf.setIP4Gateway(bsp.AP_Gateway_Address)
	ok = m.PluginNetworkConf.SetWifiAccessPointMode(true)
	
	if ok then
		dlog.sendline("@@@ SetWiFiAccessPointMode SET @@@")
	else
		dlog.sendline("@@@ SetWiFiAccessPointMode FAILED @@@")
	end if

	m.PluginNetworkConf.ConfigureDHCPServer({ ip4_start: bsp.AP_IPStart, ip4_end: bsp.AP_IPEnd, ip4_gateway: bsp.AP_AP_Address, name_servers: [ bsp.AP_AP_Address ] })
    '	m.PluginNetworkConf.ConfigureDHCPServer({ ip4_start: "192.168.10.2", ip4_end: "192.168.10.10" })
    
	'freqOK = m.PluginNetworkConf.SetAccessPointFrequencyMHz(2427)
	
	'SetAccessPointFrequencyMHz(2427) Documentation error, this call does not exist...
	
	' https://docs.brightsign.biz/display/DOC/roNetworkConfiguration#roNetworkConfiguration-SetAccessPointFrequencyMHz(frequencyAsInteger)AsBoolean
	
	'SetWiFiAccessPointFrequencyMHz - is the right method for this...
	
	freqOK = m.PluginNetworkConf.SetWiFiAccessPointFrequencyMHz(bsp.AP_frequency%)
	
	print "  @@@ m.PluginNetworkConf.SetWiFiAccessPointFrequencyMHz(2412) @@@ " freqOK
	
	if freqOK then
		dlog.sendline("@@@ SetAccessPointFrequencyMHz SET @@@")
	else
		dlog.sendline("@@@ SetAccessPointFrequencyMHz FAILED @@@")
	end if	
	
	if ok = true and freqOK = true then
		
		applied = m.PluginNetworkConf.Apply()
		
		if applied = true then
			Print "  @@@ m.PluginNetworkConf.Apply() @@@ " applied
		end if 
		
		
	end if 
	

End Sub


Function newAccess(msgPort As Object, userVariables As Object, bsp as Object)

	s = {}
	s.version = 0.4
	s.msgPort = msgPort
	s.userVariables = userVariables
	s.bsp = bsp
	s.ProcessEvent = Access_ProcessEvent
	s.objectName = "Access_Point_Plugin"
    s.getVariableValues = Access_getVariableValues
	s.debug  = true

	s.AP_SSID = "Sign_Net"
	s.AP_Password = "password"
	s.AP_frequency% = 2412
 
	s.AP_AP_Address="192.168.10.200"
	s.AP_Gateway_Address="192.168.10.1"
	s.AP_IPStart="192.168.10.2"
	s.AP_IPEnd="192.168.10.2"

  print "Set_Player_As_Access_Point_plugin version: ";str(s.version)

	return s
	
End Function

Function Access_ProcessEvent(event As Object) as boolean
	
	print " @@@ Access_Point_processevent @@@"
	
	retval = false

	if type(event) = "roAssociativeArray" then
	        if type(event["EventType"]) = "roString" then
	             if (event["EventType"] = "SEND_PLUGIN_MESSAGE") then
	                if event["PluginName"] = "Access" then
	                    pluginMessage$ = event["PluginMessage"]
	                endif
	            endif
	        endif
	end if

	return retval

End Function

Sub Access_getVariableValues()


	'AP_SSID = "Sign_Net"
	'AP_Password = "password"
	'AP_frequency% = 2412
 
	'AP_AP_Address="192.168.10.200"
	'AP_IPStart="192.168.10.2"
	'AP_IPEnd="192.168.10.2"
	'AP_Gateway_Address="192.168.10.1"

	if (m.userVariables["ssid"] <> invalid) then
		m.AP_SSID = m.userVariables["ssid"].GetCurrentValue()
	end if

	if (m.userVariables["password"] <> invalid) then
		m.AP_Password = m.userVariables["password"].GetCurrentValue()
	end if

	if (m.userVariables["frequency"] <> invalid) then
		m.AP_frequency% = int(val(m.userVariables["frequency"].GetCurrentValue()))
	end if

	if (m.userVariables["ipaddress"] <> invalid) then 'v
		m.AP_AP_Address = m.userVariables["ipaddress"].GetCurrentValue()
	end if

	if (m.userVariables["gatewayaddress"] <> invalid) then
		m.AP_Gateway_Address = m.userVariables["gatewayaddress"].GetCurrentValue()
	end if


	if (m.userVariables["ipstart"] <> invalid) then
		m.AP_IPStart = m.userVariables["ipstart"].GetCurrentValue() 'v
	end if

	if (m.userVariables["ipend"] <> invalid) then 'v
		m.AP_IPEnd = m.userVariables["ipend"].GetCurrentValue()
	end if
end Sub
