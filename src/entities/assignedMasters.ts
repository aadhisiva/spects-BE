import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Roles } from "./roles";

@Entity({ name: "AssignedMasters" })
export class AssignedMasters {

  @PrimaryGeneratedColumn("uuid")
  UserId!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  DistrictCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  TalukCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  PhcoCode!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  Name!: string;

  @Column({ type: "nvarchar", length: 15, default: null })
  Mobile!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  Otp!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  OtpExpiration!: string;

  @Column({ type: "nvarchar", length: 10, default: null })
  IsLoggedIn!: string;

  @ManyToOne(() => Roles, lr => lr.AssignedMasterFK)
  @JoinColumn({ name: "RoleId" })
  RoleId!: Roles;

  @Column({ type: "nvarchar", length: 50, default: null })
  ListType!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  Type!: string;

  @Column({ type: "nvarchar", length: 50, default: null })
  Version!: string;

  @Column({ type: "nvarchar", length: 30, default: null })
  CreatedMobile!: string;

  @Column({ type: "nvarchar", length: 30, default: null })
  CreatedRole!: string;

  @Column({ type: "nvarchar", length: 30, default: null })
  IsIntialLogin!: string;

  @Column({ type: 'datetime', nullable: true })
  BlockTime!: Date | null;

  @Column({ type: 'int', default: 0 })
  OtpAttempts!: number;

  @CreateDateColumn()
  CreatedDate!: Date;

  @UpdateDateColumn()
  UpdatedDate!: Date;
};
