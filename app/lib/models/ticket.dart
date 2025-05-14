class Ticket {
  final int id;
  String ticketcode;
  String customername;
  String controllerno;
  String head;
  String imei;
  String hp;
  String motortype;
  String state;
  String district;
  String village;
  String block;
  String complainttype;
  String faultcode;
  String details;
  String status;

  Ticket({
    required this.id,
    required this.ticketcode,
    required this.customername,
    required this.controllerno,
    required this.head,
    required this.imei,
    required this.hp,
    required this.motortype,
    required this.state,
    required this.district,
    required this.village,
    required this.block,
    required this.complainttype,
    required this.faultcode,
    required this.details,
    required this.status,
  });

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      id: json['id'],
      ticketcode: json['ticketcode'],
      customername: json['customername'],
      controllerno: json['controllerno'],
      head: json['head'],
      imei: json['imei'],
      hp: json['hp'],
      motortype: json['motortype'],
      state: json['state'],
      district: json['district'],
      village: json['village'],
      block: json['block'],
      complainttype: json['complainttype'],
      faultcode: json['faultcode'],
      details: json['details'],
      status: json['status'],
    );
  }
}
