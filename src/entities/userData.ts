import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from "typeorm";
import { Roles } from "./roles";
import { SchoolData } from "./schoolData";
import { StudentData } from "./studentData";
import { OtherBenfData } from "./otherBenfData";
import { OtherBenfDataDummy } from "./otherBenfDataDum";

@Entity({ name: "UserData" })
export class UserData {

  @PrimaryGeneratedColumn("uuid")
  UserId!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  DistrictCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  TalukCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  PhcoCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  SubCenterCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  Name!: string;

  @Column({ type: "nvarchar", length: 15, default: null })
  Mobile!: string;

  @Column({ type: "nvarchar", length: 15, default: null })
  Type!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  Otp!: string;

  @ManyToOne(() => Roles, lr => lr.UserDataFK)
  @JoinColumn({ name: "RoleId" })
  RoleId!: Roles;

  @Column({ type: "nvarchar", length: 50, default: null })
  Version!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  oldUserId!: string;

  @Column({ type: "nvarchar", length: 20, default: null })
  CreatedMobile!: string;

  @Column({ type: "nvarchar", length: 30, default: null })
  CreatedRole!: string;

  @Column({ type: "nvarchar", length: 30, default: null })
  NgoOrGov!: string;

  @CreateDateColumn()
  CreatedDate!: Date;

  @UpdateDateColumn()
  UpdatedDate!: Date;

  @OneToMany(() => OtherBenfData, otherbd => otherbd.UserId, {cascade: true, onDelete: 'CASCADE'})
  OtherBenfDataFK!: OtherBenfData[]

  @OneToMany(() => OtherBenfDataDummy, otherbd => otherbd.UserId, {cascade: true, onDelete: 'CASCADE'})
  OtherBenfDataDummyFK!: OtherBenfDataDummy[]

  @OneToMany(() => SchoolData, sc => sc.UserId, {cascade: true, onDelete: 'CASCADE'})
  SchoolDataFK!: SchoolData[]

  @OneToMany(() => StudentData, st => st.UserId, {cascade: true, onDelete: 'CASCADE'})
  StudentDataFK!: StudentData[]

};
