/**
 * Represents a resident in the Community Services Management System.
 */
export class Resident {
  constructor({
    id,
    firstName,
    lastName,
    address,
    contactNumber,
    email,
    status = "Active"
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.address = address;
    this.contactNumber = contactNumber;
    this.email = email;
    this.status = status;
  }
}