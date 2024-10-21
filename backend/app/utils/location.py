'''All locations available to the prediction model.'''

from enum import Enum

class Location(str, Enum):
	'''Enum class containing all locations available to the prediction model.'''
	Albury = "Albury"
	BadgerysCreek = "BadgerysCreek"
	Cobar = "Cobar"
	CoffsHarbour = "CoffsHarbour"
	Moree = "Moree"
	Newcastle = "Newcastle"
	NorahHead = "NorahHead"
	NorfolkIsland = "NorfolkIsland"
	Penrith = "Penrith"
	Richmond = "Richmond"
	Sydney = "Sydney"
	SydneyAirport = "SydneyAirport"
	WaggaWagga = "WaggaWagga"
	Williamtown = "Williamtown"
	Wollongong = "Wollongong"
	Canberra = "Canberra"
	Tuggeranong = "Tuggeranong"
	MountGinini = "MountGinini"
	Ballarat = "Ballarat"
	Bendigo = "Bendigo"
	Sale = "Sale"
	MelbourneAirport = "MelbourneAirport"
	Melbourne = "Melbourne"
	Mildura = "Mildura"
	Nhil = "Nhil"
	Portland = "Portland"
	Watsonia = "Watsonia"
	Dartmoor = "Dartmoor"
	Brisbane = "Brisbane"
	Cairns = "Cairns"
	GoldCoast = "GoldCoast"
	Townsville = "Townsville"
	Adelaide = "Adelaide"
	MountGambier = "MountGambier"
	Nuriootpa = "Nuriootpa"
	Woomera = "Woomera"
	Albany = "Albany"
	Witchcliffe = "Witchcliffe"
	PearceRAAF = "PearceRAAF"
	PerthAirport = "PerthAirport"
	Perth = "Perth"
	SalmonGums = "SalmonGums"
	Walpole = "Walpole"
	Hobart = "Hobart"
	Launceston = "Launceston"
	AliceSprings = "AliceSprings"
	Darwin = "Darwin"
	Katherine = "Katherine"
	Uluru = "Uluru"

	@staticmethod
	def switch(loc: str):
		match loc:
			case "Albury":
				return 0
			case "BadgerysCreek":
				return 1
			case "Cobar":
				return 2
			case "CoffsHarbour":
				return 3
			case "Moree":
				return 4
			case "Newcastle":
				return 5
			case "NorahHead":
				return 6
			case "NorfolkIsland":
				return 7
			case "Penrith":
				return 8
			case "Richmond":
				return 9
			case "Sydney":
				return 10
			case "SydneyAirport":
				return 11
			case "WaggaWagga":
				return 12
			case "Williamtown":
				return 13
			case "Wollongong":
				return 14
			case "Canberra":
				return 15
			case "Tuggeranong":
				return 16
			case "MountGinini":
				return 17
			case "Ballarat":
				return 18
			case "Bendigo":
				return 19
			case "Sale":
				return 20
			case "MelbourneAirport":
				return 21
			case "Melbourne":
				return 22
			case "Mildura":
				return 23
			case "Nhil":
				return 24
			case "Portland":
				return 25
			case "Watsonia":
				return 26
			case "Dartmoor":
				return 27
			case "Brisbane":
				return 28
			case "Cairns":
				return 29
			case "GoldCoast":
				return 30
			case "Townsville":
				return 31
			case "Adelaide":
				return 32
			case "MountGambier":
				return 33
			case "Nuriootpa":
				return 34
			case "Woomera":
				return 35
			case "Albany":
				return 36
			case "Witchcliffe":
				return 37
			case "PearceRAAF":
				return 38
			case "PerthAirport":
				return 39
			case "Perth":
				return 40
			case "SalmonGums":
				return 41
			case "Walpole":
				return 42
			case "Hobart":
				return 43
			case "Launceston":
				return 44
			case "AliceSprings":
				return 45
			case "Darwin":
				return 46
			case "Katherine":
				return 47
			case "Uluru":
				return 48
			case _:
				return -1
